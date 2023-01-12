import { Editor, MarkdownView, Plugin, TFile } from 'obsidian';
import { exec } from "child_process";

const plist = require('plist'); 

export default class MacTagPlugin extends Plugin {
	async onload() {
		this.addCommand({
			id: 'write-macos-tag',
			name: "Write Mac OS tags",
			editorCallback: (editor: Editor, view: MarkdownView) => {
				this.writeTags(view.file);
			}
		});

		this.addCommand({
			id: 'write-macos-tag-folder',
			name: "Write Mac OS tags for current folder",
			editorCallback: (editor: Editor, view: MarkdownView) => {
				view.file.parent.children.forEach((file) => {
					if (file instanceof TFile) {
						this.writeTags(file);
					}
				})
				
			}
		});
	}

	onunload() {
	}

	writeTags(file: TFile) {
		//@ts-ignore
		const fileWithPath = `${this.app.vault.adapter.basePath}/${file.path}`;
		const plTags: string = plist.build(this.getTags(file));

		exec(`xattr -w com.apple.metadata:_kMDItemUserTags '${plTags}' '${fileWithPath}'`,(error, stdout, stderr) => {
			if (error) {
				console.log(`error: ${error.message}`);
				return;
			}
			if (stderr) {
				console.log(`stderr: ${stderr}`);
				return;
			}
		});
	}

	getTags(file: TFile): string[] {
		const tags: string[] = [];
		const metadata = this.app.metadataCache.getFileCache(file);
		if (metadata?.tags) {
			metadata.tags.forEach(function (value) {
				tags.push(value.tag);
			});
		}
		if (metadata?.frontmatter) {
			if (metadata.frontmatter.tags){
				const frontmattertags: string[] = typeof metadata.frontmatter.tags === "string" ? [metadata.frontmatter.tags] : metadata.frontmatter.tags;
				frontmattertags.forEach(function (value) {
					tags.push(value);
				});
			}
		}
		return tags.map((s: string)=> s.replace("#", ""))
	}
}
