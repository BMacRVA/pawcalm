import { track } from '@vercel/analytics';

export const trackEvent = (eventName: string, properties?: Record<string, string | number | boolean>) => {
  track(eventName, properties);
};

export const analytics = {
  signupStarted: (method: 'google' | 'email') => trackEvent('signup_started', { method }),
  signupCompleted: (method: 'google' | 'email') => trackEvent('signup_completed', { method }),
  ctaClicked: (location: string) => trackEvent('cta_clicked', { location }),
  demoViewed: () => trackEvent('demo_viewed'),
  onboardingCompleted: () => trackEvent('onboarding_completed'),
  missionGenerated: () => trackEvent('mission_generated'),
  sessionLogged: () => trackEvent('session_logged'),
};