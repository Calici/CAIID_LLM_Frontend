import React from "react";
import { Button } from "@heroui/button";
import { PressEvent } from "@react-types/shared";

function press_to_mouse_event(button: HTMLButtonElement | null): MouseEvent {
  return new MouseEvent("click", {
    relatedTarget: button,
    view: window,
    bubbles: false,
    cancelable: false,
  });
}

type SafeButtonP = {
  onPress: () => Promise<unknown>;
} & Omit<React.ComponentProps<typeof Button>, "onPress" | "isLoading">;

export function useSafeButton(
  onPress: () => Promise<unknown>,
  ref: React.RefObject<HTMLButtonElement | null>
) {
  const [isLoading, setIsLoading] = React.useState(false);
  const onClick = React.useCallback(() => {
    setIsLoading(true);
    /*
      setTimeout is used here to guarantee constant behaviour between a rejected promise and
      an accepted promise. 
      Using setTimeout, a context switch is initiated after setIsLoading, forcing a re render to
      occur before the call to the function onPress. This way, the click event from the button
      will always be suppressed and only one event will be dispatched on success. 
    */
    setTimeout(() => {
      onPress()
        .then((v) => {
          if (ref !== null && ref.current !== null) {
            const event = press_to_mouse_event(ref.current);
            ref.current.dispatchEvent(event);
          }
          return v;
        })
        .finally(() => {
          setIsLoading(false);
        });
    }, 0);
  }, [onPress, ref]);
  return {
    isLoading,
    onPress: onClick,
  };
}

/**
 * A button that will loading when resolving a promise.
 * takes only :
 * onPress : Promise<unknown>
 * render: the button to render
 * ... any other props that render takes.
 */
const SafeButton = React.forwardRef(function SafeButton(
  { onPress, disableRipple = true, ...props }: SafeButtonP,
  ref: React.ForwardedRef<HTMLButtonElement>
) {
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  React.useImperativeHandle(ref, () => buttonRef.current!, []);
  const { isLoading, onPress: onClick } = useSafeButton(onPress, buttonRef);
  return (
    <Button
      {...props}
      isLoading={isLoading}
      onPress={onClick}
      disableRipple={disableRipple}
      ref={buttonRef}
    />
  );
});

export default SafeButton;
