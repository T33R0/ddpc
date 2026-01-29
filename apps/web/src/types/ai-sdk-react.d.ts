declare module '@ai-sdk/react' {
  export type ChatMessage = {
    id?: string;
    role: string;
    content: string;
  };

  export type UseChatReturn = {
    messages: ChatMessage[];
    sendMessage: (message: { role: string; content: string } | any) => Promise<void>;
    status: 'ready' | 'loading' | string;
    setMessages: (messages: ChatMessage[]) => void;
  };

  export function useChat(options?: any): UseChatReturn;

  const _default: any;
  export default _default;
}
