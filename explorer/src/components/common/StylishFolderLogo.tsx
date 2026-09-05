import React from 'react';

interface StylishFolderLogoProps {
  size?: number;
  className?: string;
}

export const StylishFolderLogo: React.FC<StylishFolderLogoProps> = ({
  size = 20,
  className = '',
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{
        display: 'inline-block',
        verticalAlign: 'middle',
        flexShrink: 0,
        filter: 'drop-shadow(0 2px 5px rgba(0, 122, 204, 0.45))',
      }}
    >
      <defs>
        <linearGradient id="folderBack" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0369a1" />
          <stop offset="100%" stopColor="#0c4a6e" />
        </linearGradient>
        <linearGradient id="folderFront" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="50%" stopColor="#0284c7" />
          <stop offset="100%" stopColor="#007acc" />
        </linearGradient>
        <linearGradient id="folderRim" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#bae6fd" stopOpacity="0.3" />
        </linearGradient>
      </defs>

      {/* Back Folder Plate with Top Tab */}
      <path
        d="M3 5.5C3 4.67157 3.67157 4 4.5 4H8.8C9.33043 4 9.83913 4.21071 10.2142 4.58579L11.6284 6H19.5C20.3284 6 21 6.67157 21 7.5V17.5C21 18.3284 20.3284 19 19.5 19H4.5C3.67157 19 3 18.3284 3 17.5V5.5Z"
        fill="url(#folderBack)"
      />

      {/* Document Sheet Peeking Inside */}
      <rect x="5.5" y="6.5" width="13" height="6.5" rx="1.5" fill="#f8fafc" fillOpacity="0.9" />
      <line x1="7.5" y1="9" x2="13" y2="9" stroke="#0284c7" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="7.5" y1="11" x2="15.5" y2="11" stroke="#94a3b8" strokeWidth="1" strokeLinecap="round" />

      {/* Front Angled / Curved Folder Pocket */}
      <path
        d="M2.5 10C2.5 9.17157 3.17157 8.5 4 8.5H8.2C8.73043 8.5 9.23913 8.71071 9.61421 9.08579L11.0284 10.5H20C20.8284 10.5 21.5 11.1716 21.5 12V18C21.5 18.8284 20.8284 19.5 20 19.5H4C3.17157 19.5 2.5 18.8284 2.5 18V10Z"
        fill="url(#folderFront)"
      />

      {/* Sleek Top Edge Rim Light */}
      <path
        d="M4 8.5H8.2C8.73043 8.5 9.23913 8.71071 9.61421 9.08579L11.0284 10.5H20C20.8284 10.5 21.5 11.1716 21.5 12"
        stroke="url(#folderRim)"
        strokeWidth="0.9"
      />
    </svg>
  );
};

