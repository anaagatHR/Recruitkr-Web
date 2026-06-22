"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

/**
 * App-wide light/dark theme provider. Uses the `class` strategy so Tailwind's
 * `dark:` variant and our `.dark` CSS variables (see index.css) switch together.
 * `enableSystem` is off so the toggle is an explicit user choice that persists.
 */
export default function ThemeProvider({ children, ...props }: ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
