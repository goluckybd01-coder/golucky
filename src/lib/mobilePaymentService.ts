/**
 * bKash/Nagad Mobile Payment Service
 * Custom payment gateway simulation with payout automation
 */

import { supabase } from "@/integrations/supabase/client";

export interface PaymentGatewayConfig {
  id: string;
  gateway_type: 'bkash' | 'nagad';
  is_enabled: boolean;
  merchant_number: string;
  min_deposit: number;
  max_deposit: number;
  min_withdraw: number;
  max_withdraw: number;
  processing_fee_percent: number;
}

export interface MobileMoneyTransaction {
  id: string;
  user_id: string;
  transaction_type: 'deposit' | 'withdraw';
  gateway_type: 'bkash' | 'nagad';
  amount: number;
  fee_amount: number;
  net_amount: number;
  sender_number?: string;
  receiver_number?: string;
  transaction_id?: string;
  reference_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded';
  failure_reason?: string;
  verified_at?: string;
  auto_verified: boolean;
  created_at: string;
}

export interface PayoutEligibility {
  eligible: boolean;
  rule_id?: string;
  auto_approve: boolean;
  message: string;
}

/**
 * Fetch gateway configuration
 */
export const fetchGatewayConfig = async (
  gatewayType: 'bkash' | 'nagad'
): Promise<PaymentGatewayConfig | null> => {
  const { data, error } = await supabase
    .from('payment_gateway_config')
    .select('id,gateway_type,is_enabled,merchant_number,auto_verify_enabled,min_deposit,max_deposit,min_withdraw,max_withdraw,processing_fee_percent,created_at,updated_at')
    .eq('gateway_type', gatewayType)
    .eq('is_enabled', true)
    .maybeSingle();

  if (error) {
    console.error('Error fetching gateway config:', error);
    return null;
  }

  return data as PaymentGatewayConfig | null;
};

/**
 * Generate unique reference ID for transaction
 */
const generateReferenceId = (): string => {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const randomPart = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  return `PAY${dateStr}${randomPart}`;
};

/**
 * Create a deposit request
 */
export const createDepositRequest = async (
  gatewayType: 'bkash' | 'nagad',
  amount: number,
  senderNumber: string
): Promise<{ success: boolean; transaction?: MobileMoneyTransaction; error?: string }> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  // Fetch gateway config for validation
  const config = await fetchGatewayConfig(gatewayType);
  if (!config) {
    return { success: false, error: `${gatewayType} is not available` };
  }

  if (amount < config.min_deposit || amount > config.max_deposit) {
    return { 
      success: false, 
      error: `Amount must be between ৳${config.min_deposit} and ৳${config.max_deposit}` 
    };
  }

  const referenceId = generateReferenceId();
  const feeAmount = (amount * config.processing_fee_percent) / 100;
  const netAmount = amount - feeAmount;

  const { data, error } = await supabase
    .from('mobile_money_transactions')
    .insert({
      user_id: user.id,
      transaction_type: 'deposit',
      gateway_type: gatewayType,
      amount,
      fee_amount: feeAmount,
      net_amount: netAmount,
      sender_number: senderNumber,
      receiver_number: config.merchant_number,
      reference_id: referenceId,
      status: 'pending'
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating deposit:', error);
    return { success: false, error: error.message };
  }

  return { success: true, transaction: data as MobileMoneyTransaction };
};

/**
 * Create a withdrawal request
 */
export const createWithdrawRequest = async (
  gatewayType: 'bkash' | 'nagad',
  amount: number,
  receiverNumber: string
): Promise<{ success: boolean; transaction?: MobileMoneyTransaction; error?: string }> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  // Fetch gateway config for validation
  const config = await fetchGatewayConfig(gatewayType);
  if (!config) {
    return { success: false, error: `${gatewayType} is not available` };
  }

  if (amount < config.min_withdraw || amount > config.max_withdraw) {
    return { 
      success: false, 
      error: `Amount must be between ৳${config.min_withdraw} and ৳${config.max_withdraw}` 
    };
  }

  // Check wallet balance
  const { data: wallet } = await supabase
    .from('wallets')
    .select('balance')
    .eq('user_id', user.id)
    .single();

  if (!wallet || wallet.balance < amount) {
    return { success: false, error: 'Insufficient balance' };
  }

  const referenceId = generateReferenceId();
  const feeAmount = (amount * config.processing_fee_percent) / 100;
  const netAmount = amount - feeAmount;

  // Check payout eligibility
  const { data: eligibility } = await supabase
    .rpc('check_payout_eligibility', {
      p_user_id: user.id,
      p_amount: amount
    });

  const eligibilityResult = eligibility?.[0] as PayoutEligibility | undefined;
  const autoApprove = eligibilityResult?.auto_approve ?? false;

  // Create transaction
  const { data, error } = await supabase
    .from('mobile_money_transactions')
    .insert({
      user_id: user.id,
      transaction_type: 'withdraw',
      gateway_type: gatewayType,
      amount,
      fee_amount: feeAmount,
      net_amount: netAmount,
      receiver_number: receiverNumber,
      reference_id: referenceId,
      status: autoApprove ? 'processing' : 'pending',
      auto_verified: autoApprove
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating withdrawal:', error);
    return { success: false, error: error.message };
  }

  // If auto-approved, add to payout queue
  if (autoApprove && data) {
    await supabase
      .from('payout_queue')
      .insert({
        transaction_id: data.id,
        priority: 1,
        status: 'queued'
      });
  }

  return { success: true, transaction: data as MobileMoneyTransaction };
};

/**
 * Fetch user's transaction history
 */
export const fetchTransactionHistory = async (
  transactionType?: 'deposit' | 'withdraw',
  limit: number = 20
): Promise<MobileMoneyTransaction[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  let query = supabase
    .from('mobile_money_transactions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (transactionType) {
    query = query.eq('transaction_type', transactionType);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }

  return data as MobileMoneyTransaction[];
};

/**
 * Verify deposit transaction (admin simulation)
 */
export const verifyDeposit = async (
  transactionId: string,
  mobileTransactionId: string
): Promise<{ success: boolean; error?: string }> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  // Get transaction
  const { data: transaction, error: fetchError } = await supabase
    .from('mobile_money_transactions')
    .select('*')
    .eq('id', transactionId)
    .single();

  if (fetchError || !transaction) {
    return { success: false, error: 'Transaction not found' };
  }

  if (transaction.status !== 'pending') {
    return { success: false, error: 'Transaction already processed' };
  }

  // Update transaction status
  const { error: updateError } = await supabase
    .from('mobile_money_transactions')
    .update({
      status: 'completed',
      transaction_id: mobileTransactionId,
      verified_at: new Date().toISOString(),
      verified_by: user.id
    })
    .eq('id', transactionId);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  // Credit wallet using secure RPC
  const typedTransaction = transaction as MobileMoneyTransaction;
  const { data: result, error: creditError } = await supabase.rpc("credit_reward", {
    p_user_id: typedTransaction.user_id,
    p_amount: typedTransaction.net_amount,
    p_reward_type: "mobile_deposit",
    p_reason: `Mobile Money Deposit`,
  });

  if (creditError) {
    console.error("Error crediting mobile payment:", creditError);
    return { success: false, error: "Failed to credit deposit" };
  }

  return { success: true };
};

/**
 * Cancel transaction
 */
export const cancelTransaction = async (
  transactionId: string
): Promise<{ success: boolean; error?: string }> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const { error } = await supabase
    .from('mobile_money_transactions')
    .update({
      status: 'cancelled',
      failure_reason: 'Cancelled by user'
    })
    .eq('id', transactionId)
    .eq('user_id', user.id)
    .eq('status', 'pending');

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
};

/**
 * Subscribe to transaction updates
 */
export const subscribeToTransactions = (
  userId: string,
  callback: (transaction: MobileMoneyTransaction) => void
) => {
  const channel = supabase
    .channel(`mobile_money_${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'mobile_money_transactions',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        callback(payload.new as MobileMoneyTransaction);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};
