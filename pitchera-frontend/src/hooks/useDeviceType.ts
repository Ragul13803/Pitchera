import { useWindowDimensions } from 'react-native';

const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
};

export const useDeviceType = () => {
  const { width, height, scale, fontScale } = useWindowDimensions();

  const isMobile = width < BREAKPOINTS.mobile;
  const isTablet = width >= BREAKPOINTS.mobile && width < BREAKPOINTS.tablet;
  const isDesktop = width >= BREAKPOINTS.tablet;

  const isPortrait = height >= width;
  const isLandscape = width > height;

  return {
    width,
    height,
    scale,
    fontScale,

    isMobile,
    isTablet,
    isDesktop,

    isPortrait,
    isLandscape,
  };
};