import os
import zipfile

root = r"C:\Users\Kingpin\Downloads\files 3\files"
out = r"C:\Users\Kingpin\Downloads\files 3\healthtrack-deploy.zip"

with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as z:
    for entry in os.listdir(root):
        if entry in {'.git', '.vercel', '__MACOSX'}:
            continue
        full = os.path.join(root, entry)
        if os.path.isdir(full):
            for dirpath, dirnames, filenames in os.walk(full):
                dirnames[:] = [d for d in dirnames if d not in {'.git', '.vercel', '__MACOSX'}]
                rel_dir = os.path.relpath(dirpath, root)
                arc_dir = rel_dir if rel_dir != '.' else ''
                for name in filenames:
                    src = os.path.join(dirpath, name)
                    arc = os.path.join(arc_dir, name) if arc_dir else name
                    z.write(src, arc)
        else:
            z.write(full, entry)

print(out)
