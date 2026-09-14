const C=HouseholdCore,$=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let rows=[],filename='RAW 파일을 불러와 주세요',result;
let filters={health:'all',screen:'all',golf:'all',free:'all'};
const keys=['health','screen','golf','free'];
function eligible(c){return result.groups[c].filter(h=>h.count>=2)}
function months(){const m=[...new Set(rows.map(r=>r.start.slice(0,7)).filter(Boolean))].sort().reverse();$('month').disabled=!m.length;if(!m.length){$('month').innerHTML='<option value="">파일 선택 후 표시</option>';return;}$('month').innerHTML=m.map(v=>`<option value="${v}">${v.slice(0,4)}년 ${Number(v.slice(5))}월</option>`).join('');}
function render(){result=C.analyze(rows,{month:$('month').value,excludeTest:$('exclude').checked});const s=result.stats;
 $('filename').textContent=filename;$('filemeta').textContent=`거래 ${rows.length.toLocaleString()}건 · 수강시작월 ${result.months.length}개`;
 $('overview').innerHTML=`<b>${esc($('month').selectedOptions[0]?.textContent||'')}</b> 기준 <b>다인원 ${keys.slice(0,3).reduce((n,c)=>n+result.groups[c].filter(h=>h.count>=2).length,0)}세대</b> <span class="muted">(시설별 합계)</span> · 무료 중복 확인 <b>${result.groups.free.filter(h=>h.freeDuplicate).length}세대</b>`;
 if(!rows.length){$('overview').textContent='RAW 매출 파일을 불러오면 시설별 집계와 동호수·회원명이 표시됩니다.';$('filemeta').textContent='XLS · XLSX · CSV / 최대 30MB';}
 $('dashboard').innerHTML=keys.map((c,i)=>panel(c,i)).join('');
 document.querySelectorAll('[data-group]').forEach(b=>b.addEventListener('click',()=>{filters[b.dataset.group]=b.dataset.value;render()}));
 renderBilling();
 $('stats').textContent=`999·9999동 ${s.test}건 · 환불 ${s.refunds}건 · 취소/비매출 ${s.cancel}건 · 전액 환불 원매출 ${s.voided}건 · 필수값 누락 ${s.missing}건 · 동일 회원 추가 등록 ${s.dedup}건 중복 제거`;
 $('review-count').textContent=result.review.length?`확인 필요 ${result.review.length}건`:'';
 $('excluded-products').innerHTML=`<p class="muted">대상 이용권 이외 ${s.unknown}건</p>`+result.unknown.map(p=>`<div class="product-row"><span>${esc(p.product)}</span><span>${p.count}건</span></div>`).join('');
 $('reviews').innerHTML=result.review.map(r=>`<div class="review-row">${esc(r.dong)}동 ${esc(r.ho)}호 · ${esc(r.name)}<br>${esc(r.product)}<br>${esc(r.reason)}</div>`).join('');
}
const won=n=>n.toLocaleString('ko-KR')+'원';
function renderBilling(){
 const groups=C.billingGroups(result),list=groups.flatMap(g=>g.rows),unknown=groups.reduce((n,g)=>n+g.unknownCount,0),total=groups.reduce((n,g)=>n+g.knownTotal,0);
 $('download-billing').disabled=!list.length;
 $('billing-meta').textContent=`${groups.length}세대 · 시설별 ${list.length}건 · 요금 확정 합계 ${won(total)}${unknown?' · 요금 확인 필요 '+unknown+'건 (합계 제외)':''}`;
 $('billing-list').innerHTML=list.length?`<div class="billing-table-wrap"><table class="billing-table"><thead><tr><th>동호수</th><th>시설 / 이용권</th><th>회원명</th><th>등록 인원</th><th>시설별 부과금액</th><th>G.TOTAL<br><small>세대 총 부과금액</small></th></tr></thead><tbody>${groups.map(g=>g.rows.map((r,i)=>`<tr><td><b>${esc(r.dong)}동 ${esc(r.ho)}호</b></td><td>${esc(r.facility)}</td><td>${r.members.map(esc).join(' · ')}</td><td>${r.count}명</td><td class="billing-amount">${r.amount===null?'요금 확인 필요':won(r.amount)}</td>${i===0?`<td rowspan="${g.rows.length}" class="gtotal"><strong>${g.total===null?'요금 확인 필요':won(g.total)}</strong>${g.total===null?`<small>확정분 ${won(g.knownTotal)}</small>`:''}</td>`:''}</tr>`).join('')).join('')}</tbody><tfoot><tr><th colspan="5">요금 확정 합계${unknown?' (미확정 요금 제외)':''}</th><td class="billing-amount">${won(total)}</td></tr></tfoot></table></div>`:'<div class="empty"><strong>부과 대상 내역이 없습니다.</strong>RAW 파일을 불러오면 선택한 월의 부과 내역이 표시됩니다.</div>';
}
function feeMarkup(c,h){
 if(c==='free')return '';
 const amount=C.householdFee(c,h.count);
 return `<div class="household-fee"><span>세대 합계 적용요금</span><strong class="${amount===null?'unset':''}">${amount===null?'요금 확인 필요':amount.toLocaleString('ko-KR')+'원'}</strong></div>`;
}
function panel(c,i){const all=eligible(c),data=all.filter(h=>filters[c]==='all'||(filters[c]==='4'?h.count>=4:h.count===Number(filters[c])));const allMembers=result.groups[c].reduce((n,h)=>n+h.count,0);
 const caption=c==='free'?`무료권 2명 이상 등록 세대만 집계`:`전체 등록 ${result.groups[c].length}세대 · ${allMembers}명`;
 return `<article class="panel ${c}"><div class="panel-head"><h2>${C.names[i]}</h2><div class="number">${all.length}<span>세대</span></div><p class="panel-caption">${caption}</p></div><div class="panel-body"><table class="summary-table"><thead><tr><th scope="col">구분</th><th scope="col">세대 수</th><th scope="col">총 인원</th></tr></thead><tbody>${[2,3,4].map(n=>{const a=all.filter(h=>n===4?h.count>=4:h.count===n);return `<tr><td>${n}명${n===4?' 이상':''}</td><td><b>${a.length}</b></td><td>${a.reduce((s,h)=>s+h.count,0)}</td></tr>`}).join('')}</tbody></table><p class="segment-label">등록 인원별 보기${c==='free'?' · 무료권 인원만':''}</p><div class="segments" aria-label="${C.names[i]} 인원 필터">${[['all','전체'],['2','2명'],['3','3명'],['4','4명 이상']].map(([v,l])=>`<button type="button" aria-pressed="${filters[c]===v}" class="${filters[c]===v?'active':''}" data-group="${c}" data-value="${v}">${l}</button>`).join('')}</div><div class="list-heading"><h3>동호수 · 회원 목록</h3><span>${data.length}세대</span></div><div class="households">${data.length?data.map(h=>`<div class="household"><div class="household-top"><span class="address">${esc(h.dong)}동 ${esc(h.ho)}호</span><span class="count">${c==='free'?'무료권 ':''}${h.count}명</span></div><div class="members">${c==='health'?'<p class="product-proof">집계 항목: 헬스 ▶ 1개월</p>':c==='free'?'<p class="product-proof">헬스 ▶ 세대당 5회 무료 ▶ 1개월</p>':''}${h.members.map(m=>`<div class="member-row"><span>${esc(m.name)}</span>${c==='free'?`<em>${esc(m.role)}</em>`:''}</div>`).join('')}</div>${feeMarkup(c,h)}</div>`).join(''):`<div class="empty"><strong>해당 세대가 없어요</strong>${c==='free'?'같은 동호수에서 무료권을<br>2명 이상 등록한 세대가 없습니다.':'선택한 인원에 해당하는<br>다인원 등록 세대가 없습니다.'}</div>`}</div></div></article>`;
}
$('month').onchange=render;$('exclude').onchange=render;
$('file').onchange=async e=>{const file=e.target.files[0];if(!file)return;$('error').hidden=true;const label=document.querySelector('.upload-button');label.setAttribute('aria-busy','true');try{if(file.size>30*1024*1024)throw Error('30MB 이하 파일을 올려 주세요.');if(!/\.(xlsx?|csv)$/i.test(file.name))throw Error('XLS, XLSX 또는 CSV 파일을 선택해 주세요.');const buffer=await file.arrayBuffer();const book=XLSX.read(buffer,{type:'array',cellDates:false});let parsed,lastError;for(const name of book.SheetNames){try{parsed=C.parseGrid(XLSX.utils.sheet_to_json(book.Sheets[name],{header:1,defval:'',raw:true}));break}catch(err){lastError=err}}if(!parsed)throw lastError||Error('읽을 수 있는 시트가 없어요.');if(!parsed.rows.some(r=>r.start))throw Error('유효한 수강시작일이 없어요.');rows=parsed.rows;filename=file.name;filters={health:'all',screen:'all',golf:'all',free:'all'};months();render();}catch(err){$('error').textContent=`${err.message||'파일을 읽지 못했어요.'} 기존 집계는 유지됩니다.`;$('error').hidden=false;}finally{label.removeAttribute('aria-busy');e.target.value=''}};
$('download-billing').onclick=()=>{
 try{const groups=C.billingGroups(result);if(!groups.length)return;const month=$('month').value;XLSX.writeFile(BillingExport.build(XLSX,groups,month,$('exclude').checked),`동호수별_부과금액_${month}.xlsx`);}
 catch(e){console.error(e);alert('엑셀 다운로드에 실패했습니다. 다시 시도해 주세요.');}
};
months();render();
if(document.modelContext?.registerTool){try{Promise.resolve(document.modelContext.registerTool({name:'get_household_summary',title:'세대별 집계 조회',description:'현재 화면의 수강시작월 및 필터에 맞는 시설별 세대 수와 회원 목록을 조회합니다.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:true},execute(input){if(input&&Object.keys(input).length)throw Error('입력 항목이 필요하지 않습니다.');return {month:$('month').value,excludeTest:$('exclude').checked,groups:Object.fromEntries(keys.map(c=>[c,eligible(c).filter(h=>filters[c]==='all'||(filters[c]==='4'?h.count>=4:h.count===Number(filters[c]))).map(h=>({dong:h.dong,ho:h.ho,count:h.count,householdFeeWon:C.householdFee(c,h.count),kind:h.kind||'',members:h.members.map(m=>({name:m.name,role:m.role||''}))}))]))}}})).catch(()=>{})}catch{}}

// 다인원 세대의 락커·신발장 요금 추가 — v5 전용
(() => {
  const core = HouseholdCore;
  if (core.lockerChargesEnabled) return;

  const originalGroups = core.billingGroups;
  const normalize = value =>
    String(value ?? "").normalize("NFKC").replace(/\s+/g, "");

  const lockerNames = new Set([
    "골프락커",
    "헬스락커(남자)",
    "헬스락커(여자)",
    "헬스신발장(남자)",
    "헬스신발장(여자)"
  ]);

  core.billingGroups = function (analysis) {
    const groups = originalGroups(analysis);
    const month = document.getElementById("month").value;

    const households = new Map(
      groups.map(g => [`${g.dong}|${g.ho}`, g])
    );

    const sales = rows.filter(
      r => r.type === "매출" && !/취소/.test(r.status)
    );

    const charges = new Map();

    for (const r of rows) {
      const title = normalize(r.product);
      const household = households.get(`${r.dong}|${r.ho}`);

      if (!household || !lockerNames.has(title)) continue;
      if (/취소/.test(r.status)) continue;
      if (!["매출", "환불"].includes(r.type)) continue;

      // 연결되는 원매출이 있으면 원매출의 수강시작월에 환불 반영
      let periodRow = r;

      if (r.type === "환불" && r.original) {
        const matches = sales.filter(s =>
          s.receipt === r.original &&
          normalize(s.product) === title &&
          s.dong === r.dong &&
          s.ho === r.ho &&
          (!r.member || s.member === r.member)
        );

        if (matches.length === 1) periodRow = matches[0];
      }

      if (
        month &&
        String(periodRow.start || "").slice(0, 7) !== month
      ) continue;

      const amount = Number(r.amount);
      if (!Number.isFinite(amount)) continue;

      const key = `${r.dong}|${r.ho}|${title}`;

      if (!charges.has(key)) {
        charges.set(key, {
          household,
          title,
          amount: 0,
          members: new Map(),
          hasRefund: false
        });
      }

      const charge = charges.get(key);

      charge.amount += r.type === "환불"
        ? -Math.abs(amount)
        : amount;

      charge.hasRefund ||= r.type === "환불";
      charge.members.set(r.member || r.name, r.name);
    }

    for (const charge of charges.values()) {
      // 전액 환불되어 금액이 0인 항목은 제외
      if (charge.amount === 0 && charge.hasRefund) continue;

      const g = charge.household;

      g.rows.push({
        category: "locker",
        facility: charge.title,
        dong: g.dong,
        ho: g.ho,
        members: [...charge.members.values()].filter(Boolean),
        count: charge.members.size,
        amount: charge.amount
      });

      g.knownTotal += charge.amount;
    }

    return groups.map(g => ({
      ...g,
      total: g.unknownCount ? null : g.knownTotal
    }));
  };

  core.lockerChargesEnabled = true;

  // 현재 화면에도 바로 반영
  renderBilling();
})();
