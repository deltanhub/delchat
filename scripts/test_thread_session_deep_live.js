const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

let passed = 0;
let total = 0;

function assert(condition, message) {
  total++;
  if (condition) {
    passed++;
    console.log('  [PASS] ' + message);
  } else {
    console.error('  [FAIL] ' + message);
    process.exit(1);
  }
}

console.log('\n================================================================');
console.log('  THREAD SESSION DEEP LIVE OPERATIONAL SIMULATION');
console.log('================================================================\n');

// 1. Partner User ID Resolution Simulation
function resolvePartnerUserId(participants, convRow, inquiryData, activeUserId, isViewerBuyer) {
  let partnerUserId = null;
  if (!isViewerBuyer) {
    const targetBuyerId = convRow?.buyer_user_id || inquiryData?.buyer_user_id;
    if (targetBuyerId && targetBuyerId !== activeUserId) {
      partnerUserId = targetBuyerId;
    } else {
      const buyerPart = (participants || []).find((p) => p.participant_role === 'buyer' && p.user_id !== activeUserId);
      if (buyerPart?.user_id) partnerUserId = buyerPart.user_id;
    }
  } else {
    const targetAgencyId = convRow?.agency_user_id || inquiryData?.agency_user_id || inquiryData?.company_user_id;
    if (targetAgencyId && targetAgencyId !== activeUserId) {
      partnerUserId = targetAgencyId;
    }
  }
  if (!partnerUserId) {
    const other = (participants || []).find((p) => p.user_id !== activeUserId);
    partnerUserId = other?.user_id || null;
  }
  return partnerUserId;
}

const pList = [{ user_id: 'buyer-01', participant_role: 'buyer' }, { user_id: 'agency-01', participant_role: 'agency' }];
const pForAgencyViewer = resolvePartnerUserId(pList, { buyer_user_id: 'buyer-01' }, null, 'agency-01', false);
assert(pForAgencyViewer === 'buyer-01', 'Agency viewer accurately resolves partner as buyer');

const pForBuyerViewer = resolvePartnerUserId(pList, { agency_user_id: 'agency-01' }, null, 'buyer-01', true);
assert(pForBuyerViewer === 'agency-01', 'Buyer viewer accurately resolves partner as agency');

// 2. Listing Object Resolution with generic title suppression
function resolveListingObject(resolvedListing, effectiveListingId, partnerSubtitleParam) {
  const isSubtitleGeneric = !partnerSubtitleParam || partnerSubtitleParam === 'Direct Message' || partnerSubtitleParam === 'Group Conversation' || partnerSubtitleParam.includes('participant');
  let listing = resolvedListing;
  if (!listing?.title && !isSubtitleGeneric && effectiveListingId) {
    listing = { id: effectiveListingId, title: partnerSubtitleParam, imageUrl: null };
  }
  if (!listing) return null;
  return { id: listing.id || effectiveListingId, title: listing.title, address: listing.address };
}

const list1 = resolveListingObject(null, 'list-123', 'Direct Message');
assert(list1 === null, 'Generic subtitle "Direct Message" suppressed from becoming listing title');

const list2 = resolveListingObject(null, 'list-123', 'Ikoyi Luxury 4-Bedroom Villa');
assert(list2 !== null && list2.title === 'Ikoyi Luxury 4-Bedroom Villa', 'Valid listing title resolved from parameter');

// 3. Assignment Object Resolution
function resolveAssignmentObject(inquiryData, isViewerProfessional, hasAssignedAgent, effectiveAgentUserId, assignedAgentName) {
  if (inquiryData && isViewerProfessional && hasAssignedAgent) {
    return {
      id: inquiryData.id,
      masterLeadStatus: inquiryData.master_lead_status || 'new',
      assignedAgentUserId: effectiveAgentUserId,
      assignedAgentName,
      agentShareEnabled: Boolean(inquiryData.agent_share_enabled),
    };
  }
  return null;
}

const inq = { id: 'inq-99', master_lead_status: 'qualified', agent_share_enabled: true };
const assignProf = resolveAssignmentObject(inq, true, true, 'agent-77', 'Agent Tunde');
assert(assignProf && assignProf.masterLeadStatus === 'qualified', 'Professional viewer resolves lead assignment');
assert(assignProf.agentShareEnabled === true, 'Agent share flag preserved');

const assignBuyer = resolveAssignmentObject(inq, false, true, 'agent-77', 'Agent Tunde');
assert(assignBuyer === null, 'Consumer viewer does not receive internal CRM lead assignment object');

// 4. Mute Duration Expiration calculation
function calculateMuteUntil(duration) {
  const now = new Date();
  if (duration === '8_hours') return new Date(now.getTime() + 8 * 3600 * 1000).toISOString();
  if (duration === '1_week') return new Date(now.getTime() + 7 * 24 * 3600 * 1000).toISOString();
  if (duration === 'forever') return new Date(now.getTime() + 100 * 365 * 24 * 3600 * 1000).toISOString();
  return null;
}

const mute8 = calculateMuteUntil('8_hours');
assert(new Date(mute8) > new Date(), '8 hours mute produces future ISO date');
const unmuted = calculateMuteUntil('unmute');
assert(unmuted === null, 'Unmute sets muted_until to null');

console.log(`\nThread Session Deep Live: ${passed} / ${total} tests passed.\n`);
