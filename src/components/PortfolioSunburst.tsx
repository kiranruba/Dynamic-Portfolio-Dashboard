"use client";

import { ResponsiveSunburst } from "@nivo/sunburst";
import { useMemo } from "react";
import chroma from "chroma-js";
import { useTheme } from "@/context/ThemeContext"; 


interface SunburstNode {
  name: string;
  color?: string;
  value?: number;
  children?: SunburstNode[];
}
export default function PortfolioSunburst({ data }: { data: SunburstNode }) {
  const sectorCount = data.children?.length ?? 0;
  const { theme } = useTheme(); // or whatever is returned

const pastelColors = useMemo(() => {
  const isDark = theme === "dark";
  return Array.from({ length: sectorCount }, (_, i) =>
    chroma.hsl(
      (i * 360) / sectorCount,
      isDark ? 0.8 : 0.6,
      isDark ? 0.35 : 0.85
    )
  );
}, [sectorCount, theme]);


  const coloredData: SunburstNode = useMemo(() => {
    return {
      ...data,
      value: undefined, // remove root value to prevent white ring
      children: data.children?.map((sector, i) => {
        const baseColor = pastelColors[i % pastelColors.length];
        const children = sector.children ?? [];
        const maxVal = Math.max(...children.map((c) => c.value ?? 0), 1);

        return {
          ...sector,
          color: baseColor.hex(),
          children: children
            .slice()
            .sort((a, b) => (b.value ?? 0) - (a.value ?? 0))
            .map((child) => {
              const ratio = (child.value ?? 0) / maxVal;
              const childColor = baseColor
                .brighten(1 - ratio * 0.6)
                .saturate(ratio * 0.4)
                .hex();
              return {
                ...child,
                color: childColor,
              };
            }),
        };
      }),
    };
  }, [data, pastelColors]);
  return (
    
<div className="relative bg-gray-100 dark:bg-gray-900 p-3 shadow-md border dark:border-gray-700 border rounded-xl h-[15.5rem] mb-6">
  <h2 className="absolute top-2 left-4 bg-gray-100 dark:bg-zinc-900 text-gray-800 dark:text-gray-300 font-semibold z-10 px-2">
    Portfolio Distribution
  </h2>

  <div className="h-full w-full pt-4 "> 
    <ResponsiveSunburst
      data={coloredData}
      id="name"
      value="value"
      margin={{ top: 15, right: 10, bottom: 3, left: 10 }}
      cornerRadius={2}
      borderWidth={1}
      borderColor={{ from: "color", modifiers: [["brighter", .7]] }}
      colors={(node) => node.data.color || "#ccc"}
      childColor={{ from: "color", modifiers: [["darker", .25]] }}
      arcLabelsSkipAngle={12}
      arcLabelsRadiusOffset={0.5}
      arcLabelsSkipRadius={10}
      arcLabel={(d) => String(d.id)}
      arcLabelsTextColor={theme === "dark" ? "#ddd" : "#333"}
      enableArcLabels
      isInteractive
      animate
      motionConfig="gentle"
      tooltip={({ id, value, percentage }) => (
        <div className="px-2 py-1 rounded bg-gray-800 text-gray-200 text-sm">
          {id}: ₹{value?.toLocaleString()} ({percentage?.toFixed(1)}%)
        </div>
      )}
      layers={["arcs", "arcLabels"]}
    />
  </div>
</div>
  );
}
