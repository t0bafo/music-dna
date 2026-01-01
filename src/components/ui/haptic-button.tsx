import React from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { useHaptics, ImpactStyle, NotificationType } from '@/hooks/use-haptics';

type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning' | 'selection';

interface HapticButtonProps extends ButtonProps {
  haptic?: HapticType;
}

/**
 * Button component with built-in haptic feedback for native apps
 */
export const HapticButton = React.forwardRef<HTMLButtonElement, HapticButtonProps>(
  ({ haptic = 'light', onClick, children, ...props }, ref) => {
    const { impact, notification, selectionChanged } = useHaptics();

    const triggerHaptic = async () => {
      switch (haptic) {
        case 'light':
          await impact(ImpactStyle.Light);
          break;
        case 'medium':
          await impact(ImpactStyle.Medium);
          break;
        case 'heavy':
          await impact(ImpactStyle.Heavy);
          break;
        case 'success':
          await notification(NotificationType.Success);
          break;
        case 'error':
          await notification(NotificationType.Error);
          break;
        case 'warning':
          await notification(NotificationType.Warning);
          break;
        case 'selection':
          await selectionChanged();
          break;
      }
    };

    const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
      await triggerHaptic();
      onClick?.(e);
    };

    return (
      <Button ref={ref} onClick={handleClick} {...props}>
        {children}
      </Button>
    );
  }
);

HapticButton.displayName = 'HapticButton';

export default HapticButton;
