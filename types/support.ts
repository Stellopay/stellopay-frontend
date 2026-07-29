/**
 * Support ticket status representing the current state of a submitted support request.
 * - open: Ticket has been submitted and is awaiting initial response
 * - in-progress: Ticket is actively being worked on by support team
 * - resolved: Issue has been resolved
 */
export type SupportTicketStatus = "open" | "in-progress" | "resolved";

/**
 * Support ticket submitted via the Contact Support form.
 * Contains user information, category, message, and current tracking state.
 */
export interface SupportTicket {
  /** Unique identifier for the ticket */
  id: string;
  /** Category of the support request */
  category: string;
  /** Subject/title of the ticket */
  subject: string;
  /** Full message content */
  message: string;
  /** Current status of the ticket */
  status: SupportTicketStatus;
  /** ISO timestamp of when ticket was submitted */
  submittedAt: string;
  /** ISO timestamp of most recent status update */
  lastUpdatedAt: string;
  /** User's first name */
  firstName: string;
  /** User's last name */
  lastName: string;
  /** User's email address */
  email: string;
}
