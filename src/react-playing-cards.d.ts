declare module '@heruka_urgyen/react-playing-cards/lib/FcB' {
  import type { FC } from 'react';

  interface CardProps {
    card: string;
    height?: string;
    front?: boolean;
    back?: boolean;
    style?: React.CSSProperties;
    className?: string;
  }

  const Card: FC<CardProps>;
  export default Card;
}
