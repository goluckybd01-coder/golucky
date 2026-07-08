import { useState, useEffect } from 'react';
import { 
  Shield, 
  Crown, 
  DollarSign, 
  Gamepad2, 
  Headphones,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  StaffRole,
  Permission,
  ROLE_LABELS,
  ROLE_DESCRIPTIONS,
  ROLE_COLORS,
  ROLE_DEFAULT_PERMISSIONS,
  PERMISSION_CATEGORIES,
  PERMISSION_LABELS
} from '@/lib/adminPermissions';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const ROLE_ICONS: Record<StaffRole, React.ReactNode> = {
  super_admin: <Crown className="h-5 w-5" />,
  finance_admin: <DollarSign className="h-5 w-5" />,
  game_admin: <Gamepad2 className="h-5 w-5" />,
  agent_admin: <Crown className="h-5 w-5" />,
  support: <Headphones className="h-5 w-5" />
};


interface RolePermissionManagerProps {
  selectedRole?: StaffRole;
  onRoleSelect?: (role: StaffRole) => void;
  viewOnly?: boolean;
}

export const RolePermissionManager = ({ 
  selectedRole = 'super_admin',
  onRoleSelect,
  viewOnly = false 
}: RolePermissionManagerProps) => {
  const [expandedCategories, setExpandedCategories] = useState<string[]>(
    Object.keys(PERMISSION_CATEGORIES)
  );

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const rolePermissions = ROLE_DEFAULT_PERMISSIONS[selectedRole];

  const hasPermission = (permission: Permission): boolean => {
    return rolePermissions.includes(permission);
  };

  return (
    <div className="space-y-6">
      {/* Role Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {(Object.keys(ROLE_LABELS) as StaffRole[]).map((role) => {
          const colors = ROLE_COLORS[role];
          const isSelected = selectedRole === role;
          const permCount = ROLE_DEFAULT_PERMISSIONS[role].length;
          
          return (
            <Card 
              key={role}
              onClick={() => !viewOnly && onRoleSelect?.(role)}
              className={cn(
                'cursor-pointer transition-all duration-200',
                isSelected 
                  ? `${colors.bg} ${colors.border} border-2` 
                  : 'bg-gray-900/50 border-gray-800 hover:border-gray-700',
                !viewOnly && 'hover:scale-[1.02]'
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className={cn(
                    'p-2 rounded-lg',
                    isSelected ? colors.bg : 'bg-gray-800'
                  )}>
                    <span className={colors.text}>
                      {ROLE_ICONS[role]}
                    </span>
                  </div>
                  {isSelected && (
                    <Badge variant="outline" className={`${colors.text} ${colors.border}`}>
                      Selected
                    </Badge>
                  )}
                </div>
                <h3 className={cn(
                  'mt-3 font-semibold text-lg',
                  isSelected ? colors.text : 'text-white'
                )}>
                  {ROLE_LABELS[role]}
                </h3>
                <p className="text-sm text-gray-400 mt-1">
                  {ROLE_DESCRIPTIONS[role]}
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <Badge variant="secondary" className="bg-gray-800 text-gray-300">
                    {permCount} permissions
                  </Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Permission Matrix */}
      <Card className="bg-gray-900/50 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Shield className="h-5 w-5 text-teal-400" />
            {ROLE_LABELS[selectedRole]} Permissions
          </CardTitle>
          <CardDescription>
            {ROLE_DESCRIPTIONS[selectedRole]}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {Object.entries(PERMISSION_CATEGORIES).map(([categoryKey, category]) => {
                const isExpanded = expandedCategories.includes(categoryKey);
                const enabledCount = category.permissions.filter(p => hasPermission(p)).length;
                const totalCount = category.permissions.length;
                
                return (
                  <div key={categoryKey} className="border border-gray-800 rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleCategory(categoryKey)}
                      className="w-full flex items-center justify-between p-3 bg-gray-800/50 hover:bg-gray-800 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-white font-medium">{category.label}</span>
                        <Badge 
                          variant="outline" 
                          className={cn(
                            enabledCount === totalCount 
                              ? 'border-green-500/50 text-green-400' 
                              : enabledCount > 0 
                                ? 'border-yellow-500/50 text-yellow-400'
                                : 'border-red-500/50 text-red-400'
                          )}
                        >
                          {enabledCount}/{totalCount}
                        </Badge>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                    
                    {isExpanded && (
                      <div className="p-3 space-y-2">
                        {category.permissions.map((permission) => {
                          const enabled = hasPermission(permission);
                          
                          return (
                            <div 
                              key={permission}
                              className={cn(
                                'flex items-center justify-between p-2 rounded-lg',
                                enabled ? 'bg-green-500/10' : 'bg-gray-800/50'
                              )}
                            >
                              <div className="flex items-center gap-3">
                                {enabled ? (
                                  <Check className="h-4 w-4 text-green-400" />
                                ) : (
                                  <X className="h-4 w-4 text-red-400" />
                                )}
                                <span className={cn(
                                  'text-sm',
                                  enabled ? 'text-white' : 'text-gray-500'
                                )}>
                                  {PERMISSION_LABELS[permission]}
                                </span>
                              </div>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Info className="h-4 w-4 text-gray-500" />
                                  </TooltipTrigger>
                                  <TooltipContent className="bg-gray-900 border-gray-700">
                                    <p className="text-sm">{permission}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <Card className="bg-gray-900/50 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Role Comparison Matrix</CardTitle>
          <CardDescription>
            Quick comparison of permissions across all roles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left py-2 px-3 text-gray-400">Permission</th>
                  {(Object.keys(ROLE_LABELS) as StaffRole[]).map((role) => (
                    <th key={role} className="text-center py-2 px-3">
                      <span className={ROLE_COLORS[role].text}>
                        {ROLE_LABELS[role].split(' ')[0]}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(PERMISSION_CATEGORIES).map(([catKey, cat]) => (
                  <>
                    <tr key={catKey} className="bg-gray-800/30">
                      <td colSpan={5} className="py-2 px-3 font-medium text-gray-300">
                        {cat.label}
                      </td>
                    </tr>
                    {cat.permissions.map((perm) => (
                      <tr key={perm} className="border-b border-gray-800/50">
                        <td className="py-2 px-3 text-gray-400">
                          {PERMISSION_LABELS[perm]}
                        </td>
                        {(Object.keys(ROLE_LABELS) as StaffRole[]).map((role) => {
                          const has = ROLE_DEFAULT_PERMISSIONS[role].includes(perm);
                          return (
                            <td key={role} className="text-center py-2 px-3">
                              {has ? (
                                <Check className="h-4 w-4 text-green-400 mx-auto" />
                              ) : (
                                <X className="h-4 w-4 text-red-400/50 mx-auto" />
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RolePermissionManager;
