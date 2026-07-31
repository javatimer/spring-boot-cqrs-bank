import { AccountType } from "./account-type";

/**
 * 
 * public class OpenAccountCommand {

    private String accountHolder;
    private AccountType accountType;
    private double openingBalance;

}
 * 
 */
export interface OpenAccountRequest {
    accountHolder: string;
    accountType: AccountType;
    openingBalance: number;
}