import { getKits, kitFile } from '../../lib/kits';
export async function getStaticPaths() { return (await getKits()).map((kit) => ({ params: { file: kit.data.file }, props: { body: kitFile(kit) } })); }
export const GET = ({ props }: { props: { body: string } }) => new Response(props.body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
