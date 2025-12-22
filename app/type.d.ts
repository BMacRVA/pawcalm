declare namespace JSX {
  interface IntrinsicElements {
    'mux-player': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      'playback-id'?: string;
      'accent-color'?: string;
      style?: React.CSSProperties;
    };
  }
}