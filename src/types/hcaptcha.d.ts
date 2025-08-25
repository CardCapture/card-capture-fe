declare global {
  interface Window {
    hcaptcha: {
      execute(sitekey: string, options?: { action?: string }): Promise<string>;
      render(element: HTMLElement | string, options: any): string;
      reset(id?: string): void;
      remove(id?: string): void;
    };
  }
}

export {};