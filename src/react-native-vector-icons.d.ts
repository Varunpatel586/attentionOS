declare module 'react-native-vector-icons/Ionicons' {
  import { Component } from 'react';
  interface IconProps {
    name: string;
    size?: number;
    color?: string;
    [key: string]: any;
  }
  const Icon: React.ComponentType<IconProps>;
  export default Icon;
}
