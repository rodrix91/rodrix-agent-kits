// Return a media type suited to the importable kit file's actual format.
// These files are served as plain text except for n8n workflow JSON, which
// clients can parse and import directly as application/json.
export function kitContentType(filename: string): string {
  return filename.toLowerCase().endsWith('.json')
    ? 'application/json; charset=utf-8'
    : 'text/plain; charset=utf-8';
}
