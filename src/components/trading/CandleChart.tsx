import { useEffect, useRef } from "react";
import { createChart, CandlestickSeries, type IChartApi, type ISeriesApi, type UTCTimestamp } from "lightweight-charts";

interface Props {
  symbol: string;
  price: number;
  height?: number;
}

export default function CandleChart({ symbol, price, height = 320 }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const candleRef = useRef<{ t: number; o: number; h: number; l: number; c: number } | null>(null);
  const symbolRef = useRef(symbol);

  useEffect(() => {
    if (!ref.current) return;
    const chart = createChart(ref.current, {
      height,
      layout: {
        background: { color: "transparent" },
        textColor: "rgba(255,255,255,0.6)",
        fontFamily: "Inter, ui-sans-serif",
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.04)" },
        horzLines: { color: "rgba(255,255,255,0.04)" },
      },
      rightPriceScale: { borderColor: "rgba(255,255,255,0.08)" },
      timeScale: { borderColor: "rgba(255,255,255,0.08)", timeVisible: true, secondsVisible: true },
      crosshair: { mode: 1 },
    });
    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#34d399",
      downColor: "#f87171",
      borderUpColor: "#34d399",
      borderDownColor: "#f87171",
      wickUpColor: "#34d399",
      wickDownColor: "#f87171",
    });
    chartRef.current = chart;
    seriesRef.current = series;
    const onResize = () => {
      if (ref.current) chart.applyOptions({ width: ref.current.clientWidth });
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [height]);

  useEffect(() => {
    if (symbolRef.current !== symbol) {
      symbolRef.current = symbol;
      candleRef.current = null;
      seriesRef.current?.setData([]);
    }
  }, [symbol]);

  useEffect(() => {
    if (!seriesRef.current || !(price > 0)) return;
    const bucket = 5;
    const tSec = Math.floor(Date.now() / 1000 / bucket) * bucket;
    const cur = candleRef.current;
    if (!cur || cur.t !== tSec) {
      const o = cur?.c ?? price;
      candleRef.current = { t: tSec, o, h: Math.max(o, price), l: Math.min(o, price), c: price };
    } else {
      cur.h = Math.max(cur.h, price);
      cur.l = Math.min(cur.l, price);
      cur.c = price;
    }
    const c = candleRef.current!;
    seriesRef.current.update({
      time: c.t as UTCTimestamp,
      open: c.o,
      high: c.h,
      low: c.l,
      close: c.c,
    });
  }, [price]);

  return <div ref={ref} className="w-full rounded-xl overflow-hidden" style={{ height }} />;
}
