import {mkdirSync,writeFileSync,copyFileSync,existsSync,readFileSync} from 'node:fs';
import {deflateSync} from 'node:zlib';
const env=Object.fromEntries((existsSync('.env')?readFileSync('.env','utf8'):'').split(/\r?\n/).filter(x=>/^[A-Z_]+=/.test(x)).map(x=>[x.slice(0,x.indexOf('=')),x.slice(x.indexOf('=')+1).replace(/^['"]|['"]$/g,'')]));
const origin=new URL(process.env.PUBLIC_URL||process.env.VITE_PUBLIC_URL||env.VITE_PUBLIC_URL||'https://outlook-calendar.mnoda1979.chatgpt.site');
if(origin.protocol!=='https:'||origin.username||origin.password||origin.pathname!=='/'||origin.search||origin.hash)throw Error('PUBLIC_URL must be an HTTPS origin');
const base=origin.origin;
const locales=(ja,en,zh)=>`DefaultValue="${ja}"><Override Locale="en-US" Value="${en}"/><Override Locale="zh-CN" Value="${zh}"/>`;
const bt=(id,ja,en,zh)=>`<bt:String id="${id}" DefaultValue="${ja}"><bt:Override Locale="en-US" Value="${en}"/><bt:Override Locale="zh-CN" Value="${zh}"/></bt:String>`;
const surfaces=['MessageReadCommandSurface','MessageComposeCommandSurface','AppointmentAttendeeCommandSurface','AppointmentOrganizerCommandSurface'];
const xml=`<?xml version="1.0" encoding="UTF-8"?>
<OfficeApp xmlns="http://schemas.microsoft.com/office/appforoffice/1.1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:bt="http://schemas.microsoft.com/office/officeappbasictypes/1.0" xsi:type="MailApp">
<Id>cf1969e8-72bd-44cc-b4ee-fb1a58db816d</Id><Version>1.0.0.0</Version><ProviderName>Monja</ProviderName><DefaultLocale>ja-JP</DefaultLocale>
<DisplayName ${locales('もんじゃグループ予定表','Monja Group Calendar','Monja 集团日历')}</DisplayName>
<Description ${locales('部署別の予定表を開きます','Open calendars by department','打开部门日历')}</Description>
<IconUrl DefaultValue="${base}/assets/icon-64.png"/><HighResolutionIconUrl DefaultValue="${base}/assets/icon-128.png"/><SupportUrl DefaultValue="${base}/#support"/>
<AppDomains><AppDomain>${base}</AppDomain></AppDomains><Hosts><Host Name="Mailbox"/></Hosts><Requirements><Sets><Set Name="Mailbox" MinVersion="1.3"/></Sets></Requirements>
<FormSettings><Form xsi:type="ItemRead"><DesktopSettings><SourceLocation DefaultValue="${base}/addin.html"/><RequestedHeight>250</RequestedHeight></DesktopSettings></Form></FormSettings>
<Permissions>Restricted</Permissions><Rule xsi:type="RuleCollection" Mode="Or"><Rule xsi:type="ItemIs" ItemType="Message" FormType="Read"/><Rule xsi:type="ItemIs" ItemType="Appointment" FormType="Read"/></Rule><DisableEntityHighlighting>false</DisableEntityHighlighting>
<VersionOverrides xmlns="http://schemas.microsoft.com/office/mailappversionoverrides" xsi:type="VersionOverridesV1_0"><Requirements><bt:Sets DefaultMinVersion="1.3"><bt:Set Name="Mailbox"/></bt:Sets></Requirements><Hosts><Host xsi:type="MailHost"><DesktopFormFactor><FunctionFile resid="Launcher.Url"/>
${surfaces.map((s,i)=>`<ExtensionPoint xsi:type="${s}"><OfficeTab id="TabDefault"><Group id="Monja.Group.${i}"><Label resid="Group.Label"/><Control xsi:type="Button" id="Monja.Open.${i}"><Label resid="Button.Label"/><Supertip><Title resid="Button.Label"/><Description resid="Button.Description"/></Supertip><Icon><bt:Image size="16" resid="Icon.16"/><bt:Image size="32" resid="Icon.32"/><bt:Image size="80" resid="Icon.80"/></Icon><Action xsi:type="ShowTaskpane"><SourceLocation resid="Launcher.Url"/></Action></Control></Group></OfficeTab></ExtensionPoint>`).join('\n')}
</DesktopFormFactor></Host></Hosts><Resources><bt:Images>${[16,32,80].map(n=>`<bt:Image id="Icon.${n}" DefaultValue="${base}/assets/icon-${n}.png"/>`).join('')}</bt:Images><bt:Urls><bt:Url id="Launcher.Url" DefaultValue="${base}/addin.html"/></bt:Urls><bt:ShortStrings>${bt('Group.Label','もんじゃ','Monja','Monja')}${bt('Button.Label','グループ予定表を開く','Open group calendar','打开集团日历')}</bt:ShortStrings><bt:LongStrings>${bt('Button.Description','部署別の予定表をWebアプリで開く','Open department calendars in the web app','在网页应用中打开部门日历')}</bt:LongStrings></Resources></VersionOverrides></OfficeApp>`;
writeFileSync('manifest.xml',xml);mkdirSync('dist/assets',{recursive:true});copyFileSync('manifest.xml','dist/manifest.xml');
function crc(b){let c=0xffffffff;for(const byte of b){c^=byte;for(let i=0;i<8;i++)c=(c>>>1)^((c&1)?0xedb88320:0);}return (c^0xffffffff)>>>0;}
function chunk(type,data){const t=Buffer.from(type);const l=Buffer.alloc(4);l.writeUInt32BE(data.length);const c=Buffer.alloc(4);c.writeUInt32BE(crc(Buffer.concat([t,data])));return Buffer.concat([l,t,data,c]);}
for(const n of [16,32,64,80,128]){const pixels=Buffer.alloc((n*4+1)*n);for(let y=0;y<n;y++)for(let x=0;x<n;x++){const i=y*(n*4+1)+1+x*4;const inCard=x>n*.13&&x<n*.87&&y>n*.18&&y<n*.87;const header=inCard&&y<n*.37;const grid=inCard&&!header&&((Math.floor(x/n*10)%3===0)||(Math.floor(y/n*10)%3===0));pixels.set(inCard?(header?[137,201,245,255]:grid?[33,109,173,255]:[244,249,255,255]):[18,85,143,255],i);}const h=Buffer.alloc(13);h.writeUInt32BE(n);h.writeUInt32BE(n,4);h[8]=8;h[9]=6;writeFileSync(`dist/assets/icon-${n}.png`,Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',h),chunk('IDAT',deflateSync(pixels)),chunk('IEND',Buffer.alloc(0))]));}
console.log('Manifest and PNG icons generated for '+base);
