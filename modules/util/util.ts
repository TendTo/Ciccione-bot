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

export function waitUntil(
  condition: () => boolean,
  timeout = 5000,
  interval = 100,
): Promise<void> {
  let timeEnlapsed = 0;
  return new Promise((resolve, reject) => {
    const check = setInterval(() => {
      if (!condition()) {
        timeEnlapsed += interval;
        return;
      }
      if (timeEnlapsed > timeout) {
        reject(new Error("Timeout"));
      }
      clearInterval(check);
      resolve();
    }, interval);
  });
}
