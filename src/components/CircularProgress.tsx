// components/CircularProgress.tsx
import React from "react";

interface CircularProgressProps {
  percent: number;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({ percent }) => {
  const radius = 18;
  const stroke = 4;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <svg height={radius * 2} width={radius * 2} className="margin-right-auto">
      <circle
        stroke="#e5e7eb"
        fill="transparent"
        strokeWidth={stroke}
        r={normalizedRadius}
        cx={radius}
        cy={radius}
      />
      <circle
        stroke="#3b82f6"
        fill="transparent"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${circumference} ${circumference}`}
        strokeDashoffset={strokeDashoffset}
        r={normalizedRadius}
        cx={radius}
        cy={radius}
      />
      {/* <text
        x="50%"
        y="50%"
        dominantBaseline="middle"
        textAnchor="middle"
        fontSize="10"
        fill="#111827"
      >
        {percent.toFixed(0)}%
      </text> */}
    </svg>
  );
};
