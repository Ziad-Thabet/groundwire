import { IEmailProvider } from "../domain/interfaces/IEmailProvider";
import { ConsoleEmailProvider } from "../providers/email/ConsoleEmailProvider";

// Swap ConsoleEmailProvider for a real IEmailProvider implementation
// (SendGrid, Resend, SES, etc.) here when ready for production.
export const emailProvider: IEmailProvider = new ConsoleEmailProvider();
