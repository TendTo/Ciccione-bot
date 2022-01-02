export class CodeManager {
  private static codes = new Map<string, string>();

  /**
   * Retrieve the code previously stored for a guild
   * @param guidID guild id
   * @returns code previously stored
   */
  public static getCode(guidID: string): string {
    return this.codes.get(guidID) ?? "Non c'è nessun codice salvato";
  }

  /**
   * Save the code for a guild
   * @param guildID guild id
   * @param code code to save
   */
  public static storeCode(guildID: string, code: string) {
    this.codes.set(guildID, code);
  }
}

/**
 * Wait until the condition is true. Check every interval ms.
 * @param condition condition to wait for
 * @param timeout timeout in ms
 * @param interval interval in ms
 */
export function waitUntil(
  condition: () => boolean,
  timeout = 5000,
  interval = 100,
): Promise<void> {
  return new Promise((resolve, reject) => {
    let timeEnlapsed = 0;
    let timer: number | undefined;
    const check = () => {
      if (condition()) {
        clearTimeout(timer);
        resolve();
      } else if (timeEnlapsed >= timeout) {
        clearTimeout(timer);
        reject(new Error("Timeout"));
      } else {
        timeEnlapsed += interval;
        timer = setTimeout(check, interval);
      }
    };
    check();
  });
}
