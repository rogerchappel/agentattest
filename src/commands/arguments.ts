export type CollectArguments = {
  since: string;
  output?: string;
};

export function parseInitArguments(args: string[]): { force: boolean } | undefined {
  if (args.length === 0) return { force: false };
  if (args.length === 1 && args[0] === "--force") return { force: true };
  return undefined;
}

export function parseCollectArguments(args: string[]): CollectArguments | undefined {
  let since: string | undefined;
  let output: string | undefined;

  for (let index = 0; index < args.length; index += 1) {
    const option = args[index];
    if (option !== "--since" && option !== "--output") return undefined;
    const value = args[index + 1];
    if (!value || value.startsWith("-")) return undefined;
    if (option === "--since") {
      if (since !== undefined) return undefined;
      since = value;
    } else {
      if (output !== undefined) return undefined;
      output = value;
    }
    index += 1;
  }

  return since === undefined ? undefined : { since, output };
}

export function parseReceiptPath(args: string[]): string | undefined {
  return args.length === 1 && args[0] !== undefined && !args[0].startsWith("-")
    ? args[0]
    : undefined;
}
