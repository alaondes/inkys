const fs = require('fs');
let content = fs.readFileSync('src/storefront/Storefront.tsx', 'utf8');

const targetStr = `                          className="absolute inset-0 w-full h-full bg-cover bg-center flex items-center justify-center px-4"
                          style={{ backgroundImage: \`url(\${currentBanner?.image})\` }}
                        >
                           <div className="absolute inset-0 bg-white/40" />
                           <div className="relative z-10 text-center flex flex-col items-center">`;

const replacementStr = `                          className={\`absolute inset-0 w-full h-full bg-cover bg-center flex items-center px-4 \${
                            currentBanner?.textAlign === 'left' ? 'justify-start md:px-16' : 
                            currentBanner?.textAlign === 'right' ? 'justify-end md:px-16' : 
                            'justify-center'
                          }\`}
                          style={{ backgroundImage: \`url(\${currentBanner?.image})\` }}
                        >
                           <div className="absolute inset-0 bg-white/40" />
                           <div className={\`relative z-10 flex flex-col \${
                            currentBanner?.textAlign === 'left' ? 'text-left items-start' : 
                            currentBanner?.textAlign === 'right' ? 'text-right items-end' : 
                            'text-center items-center'
                           }\`}>`;

content = content.replace(targetStr, replacementStr);
fs.writeFileSync('src/storefront/Storefront.tsx', content);
console.log('Fixed storefront');
