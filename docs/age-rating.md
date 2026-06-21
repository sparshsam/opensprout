# OpenSprout Age Rating Questionnaire

**Last updated:** June 21, 2026  
**Version:** 0.9.2  
**Prepared for:** Google Play, Apple App Store (future), Microsoft Store (future)

---

## Google Play — Content Rating

### Questionnaire Responses

| Question | Answer |
|----------|--------|
| Does the app contain sexual content? | No |
| Does the app contain violence or realistic violence? | No |
| Does the app contain hate speech? | No |
| Does the app contain content about alcohol, tobacco, or drugs? | No |
| Does the app contain gambling or simulated gambling? | No |
| Does the app contain user-generated content? | Yes — users can write journal entries and upload photos |
| Does the app allow users to share content with other users? | No — no social features, no sharing |
| Does the app contain digital purchases or in-app purchases? | No — free, open source |
| Does the app contain advertising? | No — no ads of any kind |
| Does the app collect personal data? | Yes — email for authentication, plant data for app functionality |
| Is the app connected to social media? | No |
| Does the app use location services? | No |
| Does the app include sharing location with others? | No |
| Does the app include any content that may be inappropriate for children? | No — plant care educational content |
| Does the app include medical or health-related content? | Yes — plant care information (educational, not medical) |
| Does the app allow users to purchase real-world goods? | No |
| Does the app include sharing of personal information (name, email, photos) with third parties? | No — data is only shared with Supabase for app functionality |
| Does the app include use of the device's camera? | Yes — optional, for taking plant photos |
| Does the app include use of the device's microphone? | No |
| Does the app include access to contacts? | No |

### Result

**Rating: Everyone**

Rationale: OpenSprout is a plant care tracking app with no mature content, no social features, no in-app purchases, and no advertising. User-generated content (journal entries, photos) is private to each user and not shared with others. Camera access is optional and used only for plant photos.

### Required Disclosures

- **User-Generated Content:** Users can add text notes and photos to their plant journal. All content is private and user-owned.
- **Digital Purchases:** None — the app is entirely free.
- **Advertising:** None — the app contains no advertising.
- **Data Collection:** Email address for account authentication only.

---

## Apple App Store — Age Rating (Future)

### Questionnaire Responses

| Question | Answer |
|----------|--------|
| Frequency: Cartoon or Fantasy Violence | None |
| Frequency: Realistic Violence | None |
| Frequency: Sexual Content or Nudity | None |
| Frequency: Profanity or Crude Humor | None |
| Frequency: Alcohol, Tobacco, or Drug Use | None |
| Frequency: Gambling or Contests | None |
| Frequency: Medical/Treatment Information | None |
| Unrestricted Web Access | No |
| Contains User-Generated Content | Yes (journal entries, photos — private to user) |
| Contains Contests | No |
| 17+ Age-Rated Content | No |
| Gambling Simulated | No |

### Result

**Age Rating: 4+**

Rationale: Plant care educational content with no objectionable material. User-generated content is not shared or visible to other users.

---

## Microsoft Store — Age Rating (Future)

### Questionnaire Responses

| Category | Answer |
|----------|--------|
| Adult content (violence, sex, hate speech) | None |
| Alcohol, tobacco, drugs | None |
| Gambling | None |
| User-generated content | Yes (private journal) |
| Location services | No |
| Camera/microphone | Camera (optional) |
| Data collection | Email for auth |
| In-app purchases | None |
| Advertising | None |

### Result

**Rating: Everyone**

---

## 4. Notes on Platform-Specific Requirements

### Google Play

- **Privacy Policy URL:** Required at listing. Provided via in-app `/privacy` page and `docs/privacy-policy.md`.
- **Data Safety section:** Must be filled in Developer Console.
  - Data collected: Email (personal info, required for account), Photos (optional), App interactions (none logged).
  - Data shared: None.
  - Data encrypted in transit: Yes.
  - Data deletion: Available via app and email request.

### Apple App Store

- Requires Apple Developer Program membership ($99/year).
- Privacy Nutrition Labels must be submitted via App Store Connect.
- Requires iOS build via Capacitor.

### Microsoft Store

- Requires Microsoft Partner Center account.
- Only applicable if a Windows build is created.

## 5. Additional Compliance Notes

### COPPA (Children's Online Privacy Protection Act)

OpenSprout does not knowingly collect personal information from children under 13. The app is directed at general audiences and does not target children. If we learn that a child under 13 has created an account, we will delete the account and associated data promptly.

### GDPR (General Data Protection Regulation)

For EU users: See `docs/data-deletion.md` for GDPR compliance details including right to access, rectification, erasure, and portability.

### CCPA (California Consumer Privacy Act)

OpenSprout does not sell personal information as defined under the CCPA. California residents have the right to:
- Request disclosure of personal information collected.
- Request deletion of personal information.
- Opt out of sale of personal information (not applicable — no data sold).

## 6. Checklist for App Store Submission

- [ ] Privacy Policy published at /privacy and docs/privacy-policy.md
- [ ] Terms of Service published at /terms and docs/terms-of-service.md
- [ ] Data Safety section completed in Google Play Console
- [ ] App Store Privacy Nutrition Labels prepared (App Store Connect)
- [ ] Age rating questionnaire completed
- [ ] Screenshots captured for all required device sizes
- [ ] Feature graphic (1024×500) prepared
- [ ] Icon (512×512) prepared
- [ ] Short description (80 chars) prepared
- [ ] Full description prepared
- [ ] Content rating confirmed
- [ ] Privacy policy URL configured in Play Console
- [ ] Support email configured in Play Console
- [ ] Test accounts provided for review (if needed)
