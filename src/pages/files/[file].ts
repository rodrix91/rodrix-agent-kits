import { getKits, kitFile } from '../../lib/kits';
import { kitContentType } from '../../lib/kit-content-type';
export async function getStaticPaths() { return (await getKits()).map((kit) => ({ params: { file: kit.data.file }, props: { body: kitFile(kit) } })); }
export const GET = ({ params, props }: { params: { file: string }; props: { body: string } }) => new Response(props.body, { headers: { 'Content-Type': kitContentType(params.file) } });
