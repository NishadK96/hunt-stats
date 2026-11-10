const TARGET=35;
let members=[];
let summary={};

const $=id=>document.getElementById(id);
const num=value=>Number(String(value??0).replace(/[^\d.-]/g,''))||0;
const escapeHtml=value=>String(value).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

function parseCsv(text){
  const rows=text.trim().split(/\r?\n/).map(line=>line.split(','));
  return rows.slice(1).map(cols=>({id:cols[0],name:cols[1],hunts:num(cols[2]),purchases:num(cols[3]),levels:[num(cols[4]),num(cols[5]),num(cols[6]),num(cols[7]),num(cols[8])],points:num(cols[9]),purchasePoints:num(cols[10])}));
}

function statusFor(points){return points>=TARGET?'complete':points>=TARGET*.75?'close':'behind'}
function statusLabel(points){return points>=TARGET?'Target complete':points>=TARGET*.75?'Close to target':'Needs attention'}
function calculate(){
  members=members.sort((a,b)=>b.points-a.points||b.hunts-a.hunts);
  const onTarget=members.filter(m=>m.points>=TARGET);
  const shortfall=members.reduce((sum,m)=>sum+Math.max(0,TARGET-m.points),0);
  const levelTotals=[0,1,2,3,4].map(i=>members.reduce((sum,m)=>sum+m.levels[i],0));
  summary={totalPoints:members.reduce((s,m)=>s+m.points,0),onTarget,shortfall,levelTotals,top:members.slice(0,5)};
}

function renderSummary(){
  const rate=Math.round(summary.onTarget.length/members.length*100);
  $('totalPoints').textContent=summary.totalPoints.toLocaleString();
  $('pointsPerMember').textContent=`${(summary.totalPoints/members.length).toFixed(1)} avg / member`;
  $('memberCount').textContent=members.length;
  $('activeMembers').textContent=`${members.filter(m=>m.hunts||m.purchases).length} recorded activity`;
  $('onTarget').textContent=summary.onTarget.length;
  $('onTargetPercent').textContent=`${rate}% of guild`;
  $('shortfall').textContent=summary.shortfall.toLocaleString();
  $('targetRate').textContent=`${rate}%`;
  $('targetRing').style.strokeDashoffset=515-(515*Math.min(rate,100)/100);
}

function renderLevels(){
  const max=Math.max(...summary.levelTotals);
  const total=summary.levelTotals.reduce((a,b)=>a+b,0);
  $('levelBars').innerHTML=summary.levelTotals.map((count,i)=>`<div class="level-row"><span class="level-name">LV ${i+1}</span><div class="bar-track"><div class="bar-value" style="width:${count/max*100}%"></div></div><span class="level-total">${count.toLocaleString()}</span></div>`).join('');
  const premium=summary.levelTotals.slice(2).reduce((a,b)=>a+b,0);
  $('qualityInsight').textContent=`Level 2 dominates at ${Math.round(summary.levelTotals[1]/total*100)}% of all guild hunts. ${premium.toLocaleString()} Level 3–5 monsters delivered higher-value points.`;
}

function renderLeaders(){
  $('leaderPodium').innerHTML=summary.top.map((m,i)=>`<div class="leader"><span class="rank-badge">${i+1}</span><div><strong>${escapeHtml(m.name)}</strong><small>${m.hunts} hunts · ${m.levels.slice(2).reduce((a,b)=>a+b,0)} high-level</small></div><div class="leader-score"><strong>${m.points}</strong><small>${Math.round(m.points/TARGET*100)}% goal</small></div></div>`).join('');
}

function renderTable(){
  const query=$('searchInput').value.trim().toLowerCase();
  const filter=$('statusFilter').value;
  const visible=members.filter(m=>(!query||m.name.toLowerCase().includes(query)||m.id.includes(query))&&(filter==='all'||statusFor(m.points)===filter));
  $('rankingBody').innerHTML=visible.map(m=>{const rank=members.indexOf(m)+1,status=statusFor(m.points),high=m.levels.slice(2).reduce((a,b)=>a+b,0);return `<tr><td>${rank}</td><td><span class="member-name">${escapeHtml(m.name)}</span><span class="member-id">ID ${escapeHtml(m.id||'—')}</span></td><td><span class="points">${m.points}</span></td><td><span class="status ${status}">${statusLabel(m.points)}</span><div class="progress-track"><div class="progress-fill ${status}" style="width:${Math.min(100,m.points/TARGET*100)}%"></div></div></td><td>${m.hunts}</td><td>${high}</td><td>${m.purchases}</td><td><button class="row-copy" data-member="${members.indexOf(m)}">Copy msg</button></td></tr>`}).join('');
  $('emptyState').hidden=visible.length>0;
  document.querySelectorAll('.row-copy').forEach(btn=>btn.addEventListener('click',()=>copyText(makeMessage(members[btn.dataset.member],'auto'))));
  return visible;
}

function makeMessage(member,type){
  const remaining=Math.max(0,TARGET-member.points),rank=members.indexOf(member)+1,percent=Math.round(member.points/TARGET*100);
  if(type==='auto')type=member.points>=TARGET?'congrats':member.points>=TARGET*.75?'close':'reminder';
  const messages={
    reminder:`Hi ${member.name} 👋 You currently have ${member.points}/${TARGET} hunt points (${percent}%). You need ${remaining} more points to complete this week's guild target. Please prioritise your hunts before reset and let an R4 know if you need help.`,
    close:`Almost there, ${member.name}! 🔥 You're on ${member.points}/${TARGET} points with only ${remaining} left. One strong hunting session can finish your weekly target. Let's close it out before reset!`,
    congrats:`Great work, ${member.name}! ✅ You completed the weekly target with ${member.points} hunt points from ${member.hunts} hunts. You're currently ranked #${rank} in the guild. Thank you for keeping the standard high!`,
    recognition:`Outstanding week, ${member.name}! 🏆 ${member.points} hunt points puts you at #${rank} in the guild and ${percent}% of target. Your ${member.levels.slice(2).reduce((a,b)=>a+b,0)} Level 3–5 hunts made a real difference. Keep leading the way!`
  };
  return messages[type];
}

function reportText(){
  const below=members.filter(m=>m.points<TARGET);
  return `⚔️ WEEKLY HUNT REPORT\n\nGuild points: ${summary.totalPoints.toLocaleString()}\nTarget completed: ${summary.onTarget.length}/${members.length} members (${Math.round(summary.onTarget.length/members.length*100)}%)\nBelow target: ${below.length}\nTotal shortfall: ${summary.shortfall} points\n\n🏆 Top 5\n${summary.top.map((m,i)=>`${i+1}. ${m.name} — ${m.points} pts`).join('\n')}\n\nKeep hunting and finish strong before reset!`;
}
function belowTargetText(){return `⚠️ MEMBERS BELOW ${TARGET} POINTS\n\n${members.filter(m=>m.points<TARGET).sort((a,b)=>b.points-a.points).map(m=>`${m.name} — ${m.points}/${TARGET} (${TARGET-m.points} needed)`).join('\n')}`}
function visibleText(){return renderTable().map(m=>`${members.indexOf(m)+1}. ${m.name} — ${m.points} pts — ${statusLabel(m.points)}`).join('\n')}
function levelsText(){return `MONSTER LEVEL BREAKDOWN\n${summary.levelTotals.map((n,i)=>`Level ${i+1}: ${n}`).join('\n')}`}
function leadersText(){return `🏆 TOP HUNTERS\n${summary.top.map((m,i)=>`${i+1}. ${m.name} — ${m.points} points (${m.hunts} hunts)`).join('\n')}`}
function broadcastText(){const below=members.length-summary.onTarget.length;return `Guild update ⚔️ We scored ${summary.totalPoints.toLocaleString()} hunt points this week. ${summary.onTarget.length} of ${members.length} members completed the ${TARGET}-point target, while ${below} still need to finish. Current top three: ${summary.top.slice(0,3).map((m,i)=>`${i+1}) ${m.name} ${m.points}pts`).join(', ')}. Please complete remaining points before reset.`}

async function copyText(text){try{await navigator.clipboard.writeText(text)}catch{const area=document.createElement('textarea');area.value=text;document.body.append(area);area.select();document.execCommand('copy');area.remove()}const toast=$('toast');toast.classList.add('show');clearTimeout(window.toastTimer);window.toastTimer=setTimeout(()=>toast.classList.remove('show'),1800)}

function populateMessages(){
  $('memberSelect').innerHTML=members.map((m,i)=>`<option value="${i}">${escapeHtml(m.name)} · ${m.points} pts</option>`).join('');
  const update=()=>{const m=members[$('memberSelect').value];$('messagePreview').textContent=makeMessage(m,$('messageType').value);$('messageStatus').textContent=`${m.points}/${TARGET} POINTS`};
  $('memberSelect').addEventListener('change',update);$('messageType').addEventListener('change',update);update();
  $('copyMessage').addEventListener('click',()=>copyText($('messagePreview').textContent));
  $('broadcastPreview').textContent=broadcastText();
}

function bind(){
  $('searchInput').addEventListener('input',renderTable);$('statusFilter').addEventListener('change',renderTable);
  $('copyReport').addEventListener('click',()=>copyText(reportText()));$('copyUnderTarget').addEventListener('click',()=>copyText(belowTargetText()));$('copyVisible').addEventListener('click',()=>copyText(visibleText()));$('copyBroadcast').addEventListener('click',()=>copyText(broadcastText()));
  document.querySelectorAll('[data-copy]').forEach(btn=>btn.addEventListener('click',()=>copyText(btn.dataset.copy==='levels'?levelsText():leadersText())));
}

async function init(){
  try{const response=await fetch('hunt-data.csv');if(!response.ok)throw new Error('Data file unavailable');members=parseCsv(await response.text());calculate();renderSummary();renderLevels();renderLeaders();renderTable();populateMessages();bind()}catch(error){document.body.innerHTML=`<main class="load-error"><h1>Could not load hunt data</h1><p>${escapeHtml(error.message)}. Serve the project through a local web server or GitHub Pages.</p></main>`;console.error(error)}
}
init();
