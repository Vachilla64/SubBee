export function DashboardIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="33"
      height="33"
      viewBox="4 3 24 24"
      style={{ opacity: active ? 1 : 0.55, transition: "opacity 0.2s" }}
    >
      <path
        d="M16 4C10.5 4 8 8 7.4 13 6.9 17 6.3 22 5.6 26L26.4 26C25.7 22 25.1 17 24.6 13 24 8 21.5 4 16 4Z"
        fill="#E7B84F"
      />
      <path
        d="M8.6 11H23.4M7.6 16H24.4M6.7 21H25.3"
        stroke="#3B2C12"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <ellipse cx="16" cy="22.4" rx="2.6" ry="3.2" fill="#3B2C12" />
    </svg>
  );
}

export function ActivityIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="40"
      height="52"
      viewBox="9 6 19 20"
      style={{ opacity: active ? 1 : 0.55, transition: "opacity 0.2s" }}
    >
      <g
        fill="#E7B84F"
        stroke="#CF9A44"
        strokeWidth="1"
        strokeLinejoin="round"
        transform="translate(-4, 0)"
      >
        <polygon
          points="23.2,16 20.85,20.07 16.15,20.07 13.8,16 16.15,11.93 20.85,11.93"
          transform="translate(-0.6, 0)"
        />
        <polygon
          points="30.7,11.5 28.35,15.57 23.65,15.57 21.3,11.5 23.65,7.43 28.35,7.43"
          transform="translate(0.6, -0.8)"
        />
        <polygon
          points="30.7,20.5 28.35,24.57 23.65,24.57 21.3,20.5 23.65,16.43 28.35,16.43"
          transform="translate(0.6, 0.8)"
        />
      </g>
    </svg>
  );
}

export function ProfileIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="33"
      height="33"
      viewBox="1 1 30 30"
      style={{ opacity: active ? 1 : 0.55, transition: "opacity 0.2s" }}
    >
      <g fill="#E7B84F">
        <ellipse cx="16" cy="6" rx="2.1" ry="4.3" />
        <ellipse
          cx="16"
          cy="6"
          rx="2.1"
          ry="4.3"
          transform="rotate(30 16 16)"
        />
        <ellipse
          cx="16"
          cy="6"
          rx="2.1"
          ry="4.3"
          transform="rotate(60 16 16)"
        />
        <ellipse
          cx="16"
          cy="6"
          rx="2.1"
          ry="4.3"
          transform="rotate(90 16 16)"
        />
        <ellipse
          cx="16"
          cy="6"
          rx="2.1"
          ry="4.3"
          transform="rotate(120 16 16)"
        />
        <ellipse
          cx="16"
          cy="6"
          rx="2.1"
          ry="4.3"
          transform="rotate(150 16 16)"
        />
        <ellipse
          cx="16"
          cy="6"
          rx="2.1"
          ry="4.3"
          transform="rotate(180 16 16)"
        />
        <ellipse
          cx="16"
          cy="6"
          rx="2.1"
          ry="4.3"
          transform="rotate(210 16 16)"
        />
        <ellipse
          cx="16"
          cy="6"
          rx="2.1"
          ry="4.3"
          transform="rotate(240 16 16)"
        />
        <ellipse
          cx="16"
          cy="6"
          rx="2.1"
          ry="4.3"
          transform="rotate(270 16 16)"
        />
        <ellipse
          cx="16"
          cy="6"
          rx="2.1"
          ry="4.3"
          transform="rotate(300 16 16)"
        />
        <ellipse
          cx="16"
          cy="6"
          rx="2.1"
          ry="4.3"
          transform="rotate(330 16 16)"
        />
      </g>
      <circle cx="16" cy="16" r="5.2" fill="#3B2C12" />
      <g fill="#6B4E1E">
        <circle cx="14.6" cy="15" r="0.85" />
        <circle cx="17.4" cy="15.3" r="0.85" />
        <circle cx="15.9" cy="17.5" r="0.85" />
      </g>
    </svg>
  );
}
