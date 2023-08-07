export default function (fileInfo: FileInfo, api: API, options: Map<string, any>) {
	const j = api.jscodeshift;
	const root = j(fileInfo.source);

	root.find(j.ImportDeclaration, { source: { value: "@material-ui/icons" } }).forEach(
		(importDeclaration) => {
			j(importDeclaration).replaceWith(() => {
				const importDeclarations = [];

				importDeclaration.node.specifiers.forEach((memberSpecifier) => {
					if (memberSpecifier.type === "ImportSpecifier") {
						const module = memberSpecifier.imported.name;
						const modulePath = `@material-ui/icons/${module}`;

						importDeclarations.push(
							j.importDeclaration(
								[j.importDefaultSpecifier(j.identifier(module))],
								j.literal(modulePath)
							)
						);
					}
				});

				return importDeclarations;
			});
		}
	);

	return root.toSource({ quote: "single" });
}
