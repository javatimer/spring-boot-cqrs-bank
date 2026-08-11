import { AccountEventType } from "./account-event-type";

export interface AccountUpdateEvent {
    type: AccountEventType;
    accountId: string;
}