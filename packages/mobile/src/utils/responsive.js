import { Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

// Brand colors matching logo
export const colors = {
  primary: '#0EA5E9',        // bbsyn blue
  background: '#FFFFFF',      // White background matching logo
  lightGray: '#F5F5F5',      // Alternative light background
  text: {
    primary: '#1e293b',
    secondary: '#64748b',
    tertiary: '#94a3b8',
  },
  border: '#cbd5e1',
  error: '#ef4444',
  success: '#10b981',
};

// Device type detection
export const isPhone = width < 768;
export const isTablet = width >= 768 && width < 1024;
export const isDesktop = width >= 1024;

// Responsive sizing functions
export const responsive = {
  // Get responsive value based on device
  size: (phone, tablet, desktop) => {
    if (isDesktop) return desktop;
    if (isTablet) return tablet;
    return phone;
  },

  // Font sizes
  fontSize: {
    small: isDesktop ? 14 : isTablet ? 13 : 12,
    regular: isDesktop ? 16 : isTablet ? 15 : 14,
    medium: isDesktop ? 18 : isTablet ? 17 : 16,
    large: isDesktop ? 24 : isTablet ? 22 : 20,
    xlarge: isDesktop ? 32 : isTablet ? 28 : 24,
    xxlarge: isDesktop ? 48 : isTablet ? 40 : 32,
  },

  // Spacing
  spacing: {
    xs: isDesktop ? 8 : isTablet ? 6 : 4,
    sm: isDesktop ? 12 : isTablet ? 10 : 8,
    md: isDesktop ? 20 : isTablet ? 16 : 12,
    lg: isDesktop ? 32 : isTablet ? 24 : 20,
    xl: isDesktop ? 48 : isTablet ? 36 : 28,
  },

  // Container widths
  containerWidth: isDesktop ? 600 : isTablet ? 500 : width * 0.88,
  maxContainerWidth: isDesktop ? 800 : isTablet ? 650 : width * 0.92,

  // Logo sizes
  logo: {
    width: isDesktop ? 500 : isTablet ? 400 : 400,
    height: isDesktop ? 200 : isTablet ? 160 : 160,
  },

  logoSmall: {
    width: isDesktop ? 180 : isTablet ? 150 : 100,
    height: isDesktop ? 72 : isTablet ? 60 : 40,
  },

  // Input heights
  inputHeight: isDesktop ? 56 : isTablet ? 52 : 48,

  // Button heights
  buttonHeight: isDesktop ? 56 : isTablet ? 52 : 48,

  // Border radius
  borderRadius: isDesktop ? 12 : isTablet ? 10 : 8,
};
