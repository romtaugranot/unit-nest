import { Type, Provider as NestJsProvider } from '@nestjs/common';

// Class constructor used to represent CUT and class-based providers only
export type Provider = Type;

// Full NestJS provider union (class/value/factory/existing/token providers)
export type NestProvider = NestJsProvider;
