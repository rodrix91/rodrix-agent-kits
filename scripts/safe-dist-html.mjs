// Collect generated HTML safely before postbuild mutates it.
// lstat() deliberately refuses symbolic links instead of following them
// outside dist. Hardlinked HTML must also be refused: writing it would
// modify the same inode through a path outside the build output.
import { lstatSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

export function listBuildHtmlFiles(root) {
  const result = [];
  const info = lstatSync(root);
  if (!info.isDirectory() || info.isSymbolicLink()) {
    throw new Error('Build output root must be a real directory');
  }
  const visit = (directory) => {
    for (const name of readdirSync(directory).sort()) {
      const path = join(directory, name);
      const details = lstatSync(path);
      if (details.isSymbolicLink()) {
        throw new Error('Build output contains a symbolic link');
      }
      if (details.isDirectory()) {
        visit(path);
      } else if (details.isFile()) {
        if (path.endsWith('.html')) {
          if (details.nlink !== 1) {
            throw new Error('Build output HTML must not have hardlinks');
          }
          result.push(path);
        }
      } else {
        throw new Error('Build output contains a non-regular entry');
      }
    }
  };
  visit(root);
  return result;
}

/**
 * Preflight every known write target, not just HTML. A file with additional
 * hardlinks could alias source material outside dist even though its path is
 * within the generated tree. Validate before writing *any* postbuild asset.
 * The generated slug inventory is also checked before composing filenames.
 */
export function validatePostbuildDestinations(root, slugs) {
  if (!Array.isArray(slugs) ||
      slugs.some((slug) => typeof slug !== 'string' || !/^[a-z0-9-]+$/.test(slug))) {
    throw new TypeError('Postbuild asset slugs must be safe filename components');
  }

  const rootInfo = lstatSync(root);
  if (!rootInfo.isDirectory() || rootInfo.isSymbolicLink()) {
    throw new Error('Build output root must be a real directory');
  }

  const generatedDir = join(root, 'og');
  let ogInfo;
  try { ogInfo = lstatSync(generatedDir); }
  catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
  if (ogInfo && (!ogInfo.isDirectory() || ogInfo.isSymbolicLink())) {
    throw new Error('Postbuild OG asset directory must be a real directory');
  }

  const targets = [
    'og/default.png', ...slugs.map((slug) => 'og/' + slug + '.png'),
    '_headers', '.nojekyll', 'sitemap.xml',
  ];
  for (const relative of targets) {
    let details;
    try { details = lstatSync(join(root, relative)); }
    catch (error) {
      if (error?.code === 'ENOENT') continue;
      throw error;
    }
    if (!details.isFile() || details.isSymbolicLink() || details.nlink !== 1) {
      throw new Error('Postbuild output must be a regular file without links: ' + relative);
    }
  }
}


/**
 * Check generated inputs before reading any of their bytes or writing any
 * postbuild assets. These fixed sources must not alias files outside dist:
 * search-en.json feeds the public OG images and sitemap-index.xml is copied
 * into the publicly served sitemap.xml. Unlike symlinks, hardlinks survive
 * a canonical-path check, so require a single-link regular inode.
 */
export function validatePostbuildInputs(root) {
  const rootInfo = lstatSync(root);
  if (!rootInfo.isDirectory() || rootInfo.isSymbolicLink()) {
    throw new Error('Build output root must be a real directory');
  }
  for (const relative of ['search-en.json', 'sitemap-index.xml']) {
    let info;
    try { info = lstatSync(join(root, relative)); }
    catch (error) {
      if (error?.code === 'ENOENT') {
        throw new Error('Postbuild input file is missing: ' + relative);
      }
      throw error;
    }
    if (!info.isFile() || info.isSymbolicLink() || info.nlink !== 1) {
      throw new Error('Postbuild input must be a single-link regular file: ' + relative);
    }
  }
}
