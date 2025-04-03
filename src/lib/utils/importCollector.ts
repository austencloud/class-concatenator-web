export class ImportCollector {
  private standardImports: Set<string> = new Set();
  private thirdPartyImports: Set<string> = new Set();
  private localImports: Set<string> = new Set();
  private importFroms: Map<string, Set<string>> = new Map();

  private readonly STANDARD_LIBS = new Set([
    'abc', 'argparse', 'asyncio', 'collections', 'concurrent',
    'contextlib', 'copy', 'csv', 'datetime', 'decimal', 'enum',
    'functools', 'glob', 'hashlib', 'html', 'http', 'importlib',
    'inspect', 'io', 'itertools', 'json', 'logging', 'math',
    'multiprocessing', 'os', 'pathlib', 'pickle', 'queue', 're',
    'random', 'shutil', 'socket', 'sqlite3', 'ssl', 'string',
    'subprocess', 'sys', 'tempfile', 'threading', 'time',
    'traceback', 'typing', 'unittest', 'urllib', 'uuid',
    'warnings', 'xml', 'zipfile'
  ]);

  // [ADDED] new method to reset state if we reuse the same instance
  reset(): void {
    this.standardImports.clear();
    this.thirdPartyImports.clear();
    this.localImports.clear();
    this.importFroms.clear();
  }

  processImports(fileContent: string): void {
    const lines = fileContent.split('\n');

    lines.forEach(line => {
      const trimmedLine = line.trim();
      // Skip comments and empty lines
      if (!trimmedLine || trimmedLine.startsWith('#')) return;

      // Process regular imports
      if (trimmedLine.startsWith('import ')) {
        const modules = trimmedLine.slice(7).split(',');
        modules.forEach(module => {
          const cleanModule = module.trim();
          this.categorizeImport(cleanModule);
        });
      }
      // Process from imports
      else if (trimmedLine.startsWith('from ')) {
        try {
          const [modulePart, importsPart] = trimmedLine.slice(5).split(' import ');
          const module = modulePart.trim();

          if (!this.importFroms.has(module)) {
            this.importFroms.set(module, new Set());
          }

          const imports = importsPart.split(',');
          imports.forEach(imp => {
            this.importFroms.get(module)?.add(imp.trim());
          });
        } catch (error) {
          // Could log or handle error here
        }
      }
    });
  }

  private categorizeImport(module: string): void {
    const baseModule = module.split('.')[0];

    if (this.STANDARD_LIBS.has(baseModule)) {
      this.standardImports.add(module);
    } else if (this.isLocalImport(module)) {
      this.localImports.add(module);
    } else {
      this.thirdPartyImports.add(module);
    }
  }

  private isLocalImport(module: string): boolean {
    // Local import is usually lowercase or starts with .
    return module.startsWith('.') || /^[a-z]/.test(module);
  }

  generateImportBlock(): string {
    const blocks: string[] = [];

    // Standard library imports
    if (this.standardImports.size > 0) {
      const sortedStandard = Array.from(this.standardImports).sort();
      blocks.push(sortedStandard.map(imp => `import ${imp}`).join('\n'));
    }

    // Third-party imports
    if (this.thirdPartyImports.size > 0) {
      if (blocks.length > 0) blocks.push('');
      const sortedThirdParty = Array.from(this.thirdPartyImports).sort();
      blocks.push(sortedThirdParty.map(imp => `import ${imp}`).join('\n'));
    }

    // Local imports
    if (this.localImports.size > 0) {
      if (blocks.length > 0) blocks.push('');
      const sortedLocal = Array.from(this.localImports).sort();
      blocks.push(sortedLocal.map(imp => `import ${imp}`).join('\n'));
    }

    // From imports
    if (this.importFroms.size > 0) {
      if (blocks.length > 0) blocks.push('');
      const sortedFromImports: string[] = [];

      for (const [module, imports] of Array.from(this.importFroms.entries()).sort()) {
        const sortedImports = Array.from(imports).sort();
        if (sortedImports.length === 1) {
          sortedFromImports.push(`from ${module} import ${sortedImports[0]}`);
        } else {
          sortedFromImports.push(`from ${module} import (`);
          sortedImports.forEach(imp => sortedFromImports.push(`    ${imp},`));
          sortedFromImports.push(')');
        }
      }

      blocks.push(sortedFromImports.join('\n'));
    }

    return blocks.join('\n');
  }
}
