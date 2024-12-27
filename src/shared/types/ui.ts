export enum ScreenType { Phone, Desktop, Tablet }
export enum InteractionType { Touch, Mouse, Controller, Voice }
export type Sticker = {
    type: string;
    name: string;
    value: string;
    html: string;
    keywords: string;
};
