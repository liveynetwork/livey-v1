type LiveyLocationButtonProps = {
  isLoading: boolean;
  onClick: () => void;
};

export function LiveyLocationButton({
  isLoading,
  onClick,
}: LiveyLocationButtonProps) {
  return (
    <button
      type="button"
      className="livey-location-button"
      onClick={onClick}
      aria-label="Center on your location"
      disabled={isLoading}
    >
      {isLoading ? (
        <span className="livey-location-loader" />
      ) : (
        <svg
          className="livey-location-icon"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            d="M12 2.75C8.42 2.75 5.55 5.56 5.55 9.04C5.55 13.57 10.71 20.05 11.47 20.97C11.74 21.3 12.26 21.3 12.53 20.97C13.29 20.05 18.45 13.57 18.45 9.04C18.45 5.56 15.58 2.75 12 2.75ZM12 6.55C13.47 6.55 14.65 7.71 14.65 9.15C14.65 10.59 13.47 11.75 12 11.75C10.53 11.75 9.35 10.59 9.35 9.15C9.35 7.71 10.53 6.55 12 6.55Z"
            fill="currentColor"
          />
        </svg>
      )}
    </button>
  );
}