export default function Logo({ size = 32, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="40" height="40" rx="11" fill="#6366f1"/>
      <rect x="7" y="6" width="17" height="21" rx="3" fill="white"/>
      <rect x="10.5" y="11" width="10" height="2" rx="1" fill="#6366f1" fillOpacity="0.5"/>
      <rect x="10.5" y="15" width="8" height="2" rx="1" fill="#6366f1" fillOpacity="0.4"/>
      <rect x="10.5" y="19" width="9" height="2" rx="1" fill="#6366f1" fillOpacity="0.4"/>
      <path
        d="M27 19.5 L34 19.5 M31.5 16.5 L34.5 19.5 L31.5 22.5"
        stroke="white"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="7" y="29.5" width="26" height="4" rx="2" fill="white" fillOpacity="0.2"/>
      <rect x="10.5" y="30.5" width="19" height="2" rx="1" fill="white" fillOpacity="0.55"/>
    </svg>
  )
}
