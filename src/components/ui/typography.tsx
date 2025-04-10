import React, { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface TypographyProps {
  variant?: 
    | "h1" 
    | "h2" 
    | "h3" 
    | "h4" 
    | "subtitle1" 
    | "subtitle2" 
    | "body1" 
    | "body2" 
    | "caption" 
    | "button" 
    | "overline";
  children: ReactNode;
  className?: string;
}

const variantClasses = {
  h1: "scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl",
  h2: "scroll-m-20 text-3xl font-semibold tracking-tight first:mt-0",
  h3: "scroll-m-20 text-2xl font-semibold tracking-tight",
  h4: "scroll-m-20 text-xl font-semibold tracking-tight",
  subtitle1: "text-xl font-semibold",
  subtitle2: "text-lg font-medium",
  body1: "leading-7",
  body2: "text-sm leading-6",
  caption: "text-xs",
  button: "font-medium",
  overline: "text-xs uppercase tracking-wider font-medium",
};

export function Typography({ 
  variant = "body1", 
  children, 
  className 
}: TypographyProps) {
  const variantClass = variantClasses[variant];
  
  const Element = 
    variant === "h1" ? "h1" :
    variant === "h2" ? "h2" :
    variant === "h3" ? "h3" :
    variant === "h4" ? "h4" :
    variant === "subtitle1" || variant === "subtitle2" ? "h6" :
    "p";
    
  return (
    <Element className={cn(variantClass, className)}>
      {children}
    </Element>
  );
} 