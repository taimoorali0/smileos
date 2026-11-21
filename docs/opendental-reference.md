# Open Dental technical reference

## Part 1 · Appointments

Source scope includes the [module index](https://www.opendental.com/site/0_modules.html), its Appointments feature pages, and the detailed desktop manual. Dropdowns populated from practice data are identified by their source. A permission marked unspecified means the cited feature documentation does not name a separate permission. Where the public manual gives a color name without a numeric code, the name is retained.

### Appointments > Schedule and module toolbar
- URL: [Appointments Module](https://opendental.com/manual/appointments.html)
- Purpose (1–2 sentences): Schedule, move, and manage visits by day, provider, and operatory. Monitor arrivals, lab readiness, and estimated production.
- Screen layout: Top action toolbar, time-by-operatory schedule, calendar, Pinboard, Appointment View picker, Lab Cases and production panel, confirmation shortcuts, and Waiting Room, Emp, Prov, and Reminders tabs. Appointment card labels, hover bubble, and operatory columns depend on the view.
- Data fields: Calendar date [date], Day/Week [view toggle], Appointment View [configured dropdown], clinic [configured dropdown when enabled], confirmation [configured status picker]. Appointment cards reflect the patient, time, procedures, providers, and any other fields selected for the view. Daily Prod and Daily Goal are money totals.
- Actions/buttons: Print opens appointment/routing-slip print setup. Lists opens the six worklists below. Pat Appts opens the patient's appointment and family recall history. Make Appt opens the editor or existing history as appropriate. Make Recall and Make Fam Recall prepare recall visits. Unsched removes the visit from its slot and queues follow-up. Break starts the broken-appointment workflow. Complete completes the visit and its attached procedures. Delete removes the selected eligible appointment. Right-click supports Pinboard, ASAP, patient history, reminders, routing slip, appointment tasks, Ortho Chart, and configured calling/texting/check-in integrations.
- Business rules & logic: Provider schedules define open areas. View settings determine time increments, visible operatories, and default scroll start. Overlap is preference-controlled. Completed visits can move within their scheduled day, subject to permissions. Changed operatory may trigger a provider reassignment or time-pattern prompt. Mirroring can display secondary provider time in a second operatory. Recall creation attaches due procedures and can search from the due date, or the latest due date for a family.
- Statuses/workflow: Scheduled → Complete or Broken. Follow-up can move to Unsched List and later back to Scheduled. Confirmation and ASAP are separate attributes. Waiting Room lists arrived patients who have yet to be seated.
- Links to other modules: Family supplies demographics, provider and recall data. Chart and Treatment Plan supply procedures, which completion updates. Schedule Setup, Operatories, Definitions, and Appointment Views drive the display. Tasks and eServices support reminders and communications.
- Permissions: Appointments Module, Appointment Create, Appointment Move, Appointment Resize, Appointment Edit, Completed Appointment Edit, Appointment Delete, Appointment Confirmation Status Edit, and Create Completed Procedure (or set complete). See the [permission catalog](https://opendental.com/manual/permissions.html).
- Reports/lists it appears in: Daily production, daily goals, Appointments for Patient, routing slips, and the six Appointments worklists.

### Appointments > Edit Appointment
- URL: [Edit Appointment](https://opendental.com/Manual/aptedit.html)
- Purpose (1–2 sentences): Maintain the visit's scheduling, clinical attachments, confirmation, and notes.
- Screen layout: Title with patient, day, date, time, and operatory. Left time-pattern bar and patient summary, appointment fields and settings, quick-add procedure list and procedure grid, free-text note, and communication history.
- Data fields: Status [Scheduled, Complete, Unsched List, Broken], ASAP [checkbox], Unscheduled Status [Recall / Unsched Status definitions], Confirmed [Appt Confirmed definitions], New Patient [checkbox], Clinic [configured clinic], Provider [required dentist], Hygienist [optional provider], Is Hygiene [checkbox], Assistant [Employees dropdown], Time Locked [checkbox], Color [picker/None], Appointment Type [visible configured types], Time Ask to Arrive, Arrived, Seated and Dismissed [time], Lab [case picker], InsPlan1/InsPlan2 [derived plan, with completed-appointment picker limited to family plans or None], Appointment Note [multiline], Show Automated Commlogs [checkbox], and custom Appt Fields [practice definitions]. Time pattern uses selectable provider intervals, a duration slider and one-character annotations per increment. Procedure selection is a multi-select grid with configurable columns. Read-only summary includes name, birthdate, phones, address, phone notes, credit/billing types, total balance, family balance, estimated patient portion and total appointment fee. Req and Obs open optional Dental Schools and EHR selectors.
- Actions/buttons: Add opens Procedure Codes and attaches a newly planned procedure. Attach All selects the grid rows. Procedure Delete deletes selected procedures subject to validation. Double-click opens Procedure Info. Comm creates a communication entry. Text sends the configured confirmation message. Audit Trail opens visit history. To Task List attaches or reopens a task. Pinboard queues scheduling when available. Save persists the visit. The separate appointment Delete removes the appointment.
- Business rules & logic: Provider defaults fall through from scheduled operatory provider to assigned operatory provider to patient's primary provider. Hygiene defaults use the analogous secondary-provider chain. New Patient defaults on when first-visit date and completed procedures are both absent. Manual or type-defined time patterns lock automatic duration changes. Frequency conflicts and existing unscheduled visits can raise warnings. Required-procedures preference can block empty visits. Reverting a completed procedure to treatment planned detaches it. Current plans auto-populate and update for scheduled visits, then become historical on completion. The projected patient portion considers write-offs, insurance estimates, and discounts, and considers actual insurance payments and adjustments for completed visits. Text requires a wireless number, consent and Integrated Texting.
- Statuses/workflow: Scheduled, Complete, Unsched List, Broken. Configured confirmation triggers typically use Arrived, In Treatment Room and Front Desk to populate arrival, seating and dismissal times. Right-click Now inserts the current time.
- Links to other modules: Reads Family patient data and insurance, Chart procedures, Account balances, Treatment Plan estimates, and employee/provider setup. Writes procedure links, appointment communication, task associations and lab links.
- Permissions: Appointment Create, Appointment Edit, Completed Appointment Edit, Appointment Resize, Appointment Delete, Appointment Confirmation Status Edit, View Appointment Audit Trail. Completing linked procedures uses Create Completed Procedure (or set complete).
- Reports/lists it appears in: Schedule, patient appointment history, confirmation, insurance verification, unscheduled, planned tracker, and ASAP where eligible.

### Appointments > Blockouts
- URL: [Blockouts](https://www.opendental.com/manual/blockouts.html)
- Purpose (1–2 sentences): Reserve or label operatory time and enforce optional booking restrictions.
- Screen layout: Colored schedule overlay, operatory context menu, Edit Blockout dialog and day/week copy dialog.
- Data fields: Start/Stop [time, picker or typed], Note [text], Blockout Type [configured], Operatories [multi-select, clinic-scoped], Include Weekends and Replace Existing [checkboxes], Repeat # [integer], Clipboard Contents [read-only day/week range].
- Actions/buttons: Add/Edit, Cut/Copy/Paste, Delete, and Clear All for Day/Op/Clinic affect the selected scope. Edit Blockout Types opens Definitions. Batch tools offer Clear Day, Copy Day, Copy Week, Paste and Repeat.
- Business rules & logic: New blocks default to clicked time through one hour later. Manual times support minute precision. Blocks cannot overlap unless the configured replacement policy removes the existing blocks. Multi-operatory blocks created together are linked for deletion/replacement. Bulk operations use visible operatories and exclude types with Disable Cut/Copy/Paste. A conflict stops a paste when Replace Existing is unchecked. Allowed appointment types can book within compatible blocks. Untyped visits can use blocks that permit scheduling.
- Statuses/workflow: Configured use can permit or block scheduling, and can disable cut/copy/paste. NS means No appointment scheduling. DC means Disable Cut/Copy/Paste.
- Links to other modules: Definitions provides color, label and behavior. Appointment Types defines compatibility. Pinboard search applies relevant restrictions.
- Permissions: Blockouts. The manual documents limited add/edit/delete access for users without that permission on blocks flagged NS or DC.
- Reports/lists it appears in: Appointment schedule, Blockout Types definitions, and appointment search eligibility.

### Appointments > Pinboard and Search
- URL: [Pinboard and Search](https://opendental.com/Manual/apptpinboard.html)
- Purpose (1–2 sentences): Hold appointments while finding a new slot manually or through search.
- Screen layout: Pinboard under calendar, basic Openings in View list, and Advanced Appointment Search results/filter dialog.
- Data fields: Basic After [date], Before/After [times], Providers [multi-select]. Advanced From/To [dates], Starting before/after [times], Providers [configured multi-select], Blockout [eligible configured types], Clinic [accessible clinics or Unassigned], Appt View [configured view when clinic Unassigned]. Search Behavior [ProviderTime, ProviderTimeOperatory].
- Actions/buttons: Drag or Copy to Pinboard; Clear empties the board and restores existing visits to their original time; Search refreshes; More gets next page; Providers/Hygienists selects primary/secondary provider groups; clicking a result jumps the schedule; dragging onto the schedule books it.
- Business rules & logic: Items are instance-local, survive logout/login, and clear when the application closes. Basic results show first opening for each of 10 dates, advanced up to 15. Basic search requires provider schedules and uses the active view. Advanced requires a provider or blockout. ProviderTime checks provider availability and time, while ProviderTimeOperatory further checks operatory bookings and scheduling-blocking blockouts. Clinic restrictions limit results. Type-specific blockout rules can restrict openings automatically.
- Statuses/workflow: New, existing, unscheduled, planned-copy or recall visit staged → slot selected → scheduled. Rescheduling from Pinboard resets confirmation to the default.
- Links to other modules: Reads Schedule Setup, Appointment Views, operatories, clinic access and status definitions. Accepts visits from Chart, patient history, Recall and appointment lists.
- Permissions: Appointment Move for existing appointment movement and Appointment Create for new or planned-copy scheduling, subject to version behavior. No separate search permission identified.
- Reports/lists it appears in: Openings in View and Advanced Search results. Booked items appear on the applicable schedule and worklists.

### Appointments > Insurance Verification List
- URL: [Insurance Verification List](https://www.opendental.com/manual/insverifylist.html)
- Purpose (1–2 sentences): Queue and assign manual verification of insurance benefits and patient eligibility around appointment dates.
- Screen layout: Shared filters, Verification List with Current/Past Due views, Standard and Medicaid assignment tabs, plan/subscriber details, and verification status and notes. Grid columns are Type, Patient, Appt Date Time, Carrier, Last Verified, Status, Status Date, and Assigned to.
- Data fields: Days until scheduled appointment, days since plan benefit verification, and days since patient eligibility verification [integer criteria, configurable separately for standard and Medicaid]; Carrier [name text]; For User [All Users, Unassigned or eligible assigned users]; Verify Status [configured list]; Region and Clinic [configured/accessible options]; To User [picker with Select None]; Note and Status Note [text]. Last Verified and Status Date are read-only dates.
- Actions/buttons: Sort headers, open Family or patient plan, assign/unassign, set status and add note, mark benefits verified, mark eligibility verified, or verify both on combined rows. Double-click opens the plan.
- Business rules & logic: At most one benefits verification row per plan, paired with the nearest applicable patient when combined. Eligibility is tracked per patient. A plan flagged Don't Verify is excluded. Medicaid classification uses configured filing codes. Last Verified for a combined row uses the oldest date. 01/01/0001 represents an unset date. Verification can use today's date or the appointment date under service-year preferences. Reassignment replaces the prior assignee.
- Statuses/workflow: Pat, Ins, Ins/Pat are queue types. Current and Past Due are time buckets. The status dropdown uses Insurance Verification Status definitions. Assign → set working status/note → mark the applicable verification date.
- Links to other modules: Reads appointments and Family insurance data and writes plan-wide benefits and patient-specific eligibility dates back to Edit Insurance Plan.
- Permissions: Feature documentation identifies Insurance Verification for access. The permission catalog names Insurance Plan Verification Assign for assignment eligibility and Insurance Plan Edit for insurance edits.
- Reports/lists it appears in: Verification List, Current/Past Due and Standard/Medicaid assignment lists.

### Appointments > Appointment Types
- URL: [Appointment Types](https://www.opendental.com/manual/appointmenttypes.html)
- Purpose (1–2 sentences): Configure visit templates with procedures, duration, color, and block scheduling constraints.
- Screen layout: Setup settings and ordered type list. Editor contains identity/color, duration pattern, auto-added procedures, required procedures and allowed Blockout Types.
- Data fields: New appointments prompt and Warn users before disassociating procedures [checkboxes]; Name [text], Color [picker/None], Hidden [checkbox], Time [duration slider and X provider or / non-provider per increment], Procedures to Add and Required Procedures [code selectors], required mode [At Least One, All], Allowed Blockout Types [configured multi-select].
- Actions/buttons: Add, double-click Edit, Up/Down, Clear time override, Add/Remove codes in both lists, Save. Selecting a type in Edit Appointment applies its setup.
- Business rules & logic: Custom time overrides procedure-derived time. Otherwise procedure defaults apply where present. A type change with empty timing preserves the previous visit pattern. Type change plans the new procedures and can detach old procedures from the visit while leaving them treatment planned. Required mode is disabled with an empty required list. General codes suit auto-add because no treatment-area entry is prompted. The chosen color overrides provider color and can be propagated to existing future visits when prompted.
- Statuses/workflow: Visible or Hidden type; appointment status follows the appointment's own workflow.
- Links to other modules: Procedure Codes, Treatment Plan, Blockouts, Appointment View time increment and Web Sched New Patient definitions.
- Permissions: The feature page does not name a dedicated type editor permission. Appointment create/edit permissions govern applying a type during appointment work.
- Reports/lists it appears in: Appointment Types setup, appointment type picker, Edit Appointment, and supported Web Sched type selection.

### Appointments > Lab Cases
- URL: [Lab Case editor](https://opendental.com/Manual/labcaseedit.html) · [Lab Cases overview](https://www.opendental.com/site/0_labcases.html)
- Purpose (1–2 sentences): Track cases sent to outside labs and ensure work is ready by the linked appointment.
- Screen layout: Schedule lab summary, filterable outstanding case list, case editor with case/appointment metadata, lab services, due date, instructions and tracking dates, and Lab Slip editor.
- Data fields: Patient [linked record], Appointment and Planned Appt [references], Provider and Lab [configured selectors], Fee [money], Invoice Number [optional text], Set Due Date [lab service/turnaround options], Date Time Due [datetime], Instructions [multiline], Created/Sent/Received/Quality Checked [datetime], list date and clinic filters.
- Actions/buttons: Lab opens case selection; New creates and attaches; Detach unlinks without deleting. Click a service for calculated due date. Now fills tracking timestamp. New Slip/Edit Slip creates or opens a sheet. Delete removes case after deleting any attached slip. Output slip as print, email or PDF.
- Business rules & logic: Service turnaround skips weekends and defined holidays. Provider schedule has no effect on due-date calculation. Fee and invoice number are informational. Blank due time may render as 01/01/0001 12:00 AM in slip output. Creating from an appointment links it automatically. A configured imaging category saves a PDF on slip output.
- Statuses/workflow: Created → Sent → Received → Quality Checked. Attachment to scheduled/planned visit is separate.
- Links to other modules: Chart and Treatment Plan can create cases. Chart Progress Notes receives a case entry. Sheets provides lab slip templates. Imaging can receive PDFs.
- Permissions: No separate lab case permission identified in these pages.
- Reports/lists it appears in: Lists → Lab Cases, daily Appointments lab panel, appointment card Lab field if enabled, and Chart Progress Notes.

### Appointments > Routing Slips
- URL: [Routing Slips](https://www.opendental.com/manual/routingslips.html) · [Routing Slip Layout](https://opendental.com/manual/sheetsroutingslips.html)
- Purpose (1–2 sentences): Print a configured paper routing sheet for one visit or a batch.
- Screen layout: Daily report dialog with provider and clinic picklists and date. Appointment print dialog offers day-wide and current-view scopes.
- Data fields: Providers and Clinics [multi-select and All checkboxes], Date [date], print scope [All for Day, Current View Only], sheet type [RoutingSlip in Sheets].
- Actions/buttons: Today fills current date. Displayed fills the schedule date. Appointment context menu prints one slip. Print toolbar prints batches. In Sheets, New, Duplicate or Copy produces an editable template.
- Business rules & logic: All clinics includes hidden clinics. With multiple custom layouts the first alphabetically is used. Current View Only follows the selected Appointment View. Language translations are unavailable for these sheets.
- Statuses/workflow: Select visit/date and scope → generate slips → print. No slip status documented.
- Links to other modules: Reads scheduling, patient and template fields. Sheets controls field layout and content.
- Permissions: Report Setup security controls access to the Daily report entry.
- Reports/lists it appears in: Standard Reports → Daily → Routing Slips and the Appointments print menus.

### Appointments > Planned Appointments
- URL: [Planned Appointments](https://www.opendental.com/manual/apptplanned.html)
- Purpose (1–2 sentences): Record treatment ready for a follow-up visit before a date is booked.
- Screen layout: Chart Planned Appts tab grid with #, Procedures, Note and DateSched. Also accessible from Treatment Plan and the Appointments for Patient list.
- Data fields: Order [integer], linked procedures [multi-select], Note [text], time pattern/duration [appointment controls], Lab [case picker], DateSched [derived date], Done, Show Completed and Show Completed Planned Appts [checkboxes].
- Actions/buttons: Add/+Plan Appt opens the editor, Delete removes selected plans, Pinboard/Copy to Pinboard stages a copy, Up/Down reorders, Done deletes all plans, and double-click edits. Show Completed changes visibility.
- Business rules & logic: Booking copies duration and procedures and transfers lab links. The plan stays on record. Subsequent edits to the plan do not update the scheduled copy. DateSched follows the most recently added scheduled visit when procedures are split. Completion of linked visit or all planned procedures completes the plan. Prompt preference applies to newly entered treatment outside Diagnostic, DiagnosticXray and RoutinePreventative categories. Show Completed resets on restart.
- Statuses/workflow: Planned → scheduled copy exists → completed → optional cleanup. Scheduled visit deletion can return the plan to the tracker. Done clears plans and signals there is no planned follow-up.
- Links to other modules: Chart Progress Notes pairs planned and scheduled records. Treatment Plan supplies procedures. Lab cases follow into scheduled visits.
- Permissions: Appointment Create applies when scheduling a planned copy. The planned feature page does not specify a separate edit permission.
- Reports/lists it appears in: Planned Appointment Tracker, Appointments for Patient, Chart Planned Appts/Progress Notes, and ASAP when flagged.

### Appointments > Recall List
- URL: [Recall List](https://www.opendental.com/manual/recalllist.html)
- Purpose (1–2 sentences): Find patients due for preventive recalls and track reminders until they schedule.
- Screen layout: Filters/status controls, configurable grid, scheduling and print/communications actions, with Reminders and Reactivations views. Grid can show Due Date, Patient, Age, Type, Interval, #Remind, LastRemind, Contact, Status, Note, Billing Type, WebSched, Carrier Name.
- Data fields: From/To [date], Show Reminders [count selection], Recall Type [Perio, Prophy, All], Sort [Due Date, Alphabetically, Billing type], Provider, Clinic and Site [configured], Group Families, Show Conflicting Types and Include Reminded [checkboxes], Set Status [Recall / Unsched Status definitions], Email From [configured sender]. Default recall types in setup include Prophy, Child Prophy and Perio. Contact codes include Mail, Hm, Wk, Cell, Email address, SeeNotes and Text.
- Actions/buttons: Refresh, Set, double-click Edit Recall, navigate to Family or Account, preview postcards, print single labels or preview a 30-label sheet, email, Run Report, Print List, Comm, Undo batch, Sched Patient, Sched Family, and Web Sched.
- Business rules & logic: Due dates derive from completed recall procedures or insurance history. A Recall commlog counts as reminder and suppresses the row for the configured interval. The maximum attempt count also suppresses results unless Include Reminded is used. Grouped reminders can use guarantor contact and consolidate family messages. Label printing sets Mailed Postcard. A qualifying special recall spawns a Pinboard appointment with procedures. Linked online scheduling requires Web Sched Recall. Automated email/text reminders can also be configured without scheduling links. Family peers highlight in red text when one member is selected.
- Statuses/workflow: Due → contacted/suppressed → appears again if still due after the reminder interval → scheduled → cycle resets on completion. WebSched display includes blank, Sending and Send Failed. Contact outcomes are configurable.
- Links to other modules: Family Recall, contact preferences, clinical completion history, provider schedules, Pinboard, Account/Chart communication history and eServices.
- Permissions: Undo requires Security Admin. Scheduling and navigation use their ordinary module/action permissions.
- Reports/lists it appears in: Recall, Reminders, Reactivations, printed list and mail-merge query output.

### Appointments > Confirmation List
- URL: [Confirmation List](https://www.opendental.com/site/0_confirmationlist.html) · [Confirmation Status](https://www.opendental.com/manual/confirmationstatus.html)
- Purpose (1–2 sentences): Maintain confirmation status and contact patients for scheduled visits in batches.
- Screen layout: Nonmodal worklist with View filters, appointment results grid, status-setting controls and print/message buttons.
- Data fields: Appointment date [date filter], confirmation status filter and Set Status [configured Appt Confirmed definitions], appointment row selection [multi-select]. The overview does not enumerate every grid column or filter.
- Actions/buttons: Set Status updates selected appointments. Postcard Preview and Label Preview prepare print output, Email and Text send confirmations, Run Report exports data to a text file, and Print List prints the displayed list.
- Business rules & logic: Message templates are configurable. The first confirmation definition is the default on new visits. Manual messages, eConfirmation sends, or patient replies can update status. A same-day move on a future date can prompt for reset when the status differs from default. Pinboard rescheduling resets automatically. A prior eConfirmation can trigger a resend prompt.
- Statuses/workflow: Confirmation statuses are configured. Typical automated entries include eConfirmSent, eConfirmCallBack, eConfirmFailure, and Created from Web Sched. The confirmed and unconfirmed labels are practice-configurable.
- Links to other modules: Reads appointments and patient communications data; writes confirmation status and uses Integrated Texting and automated messaging.
- Permissions: Appointment Confirmation Status Edit; status changes are audited.
- Reports/lists it appears in: Confirmation List, confirmation text export, print output, and appointment cards with Confirmed Color configured.

### Appointments > Planned Appointment Tracker
- URL: [Planned Appointment Tracker](https://opendental.com/Manual/appttracker.html)
- Purpose (1–2 sentences): Find treatment visits that were planned without a booking or whose booking was deleted.
- Screen layout: Filter/sort controls, result grid, setup for default date window and right-click navigation.
- Data fields: Order by [Status, Alphabetical, Date], Provider, Clinic, Site [configured selectors], Code Range [single code or range], From/To [dates or blank for all], Days Past and Days Future [integers].
- Actions/buttons: Setup sets defaults, Refresh updates results, All Dates clears bounds, Print prints list, double-click edits, Select Patient and See Chart navigate, Send to Pinboard stages scheduling.
- Business rules & logic: Includes active Patient records and qualifying appointment creation dates. Status sorting groups by unscheduled status. Scheduling removes the record from the tracker while it remains in Chart; a deleted booking can make the plan eligible again.
- Statuses/workflow: Unbooked Planned → booked and removed from tracker → possibly back on list if booking is deleted → complete.
- Links to other modules: Chart and Treatment Plan provide planned records and procedures. Pinboard and Schedule perform booking.
- Permissions: Scheduling a planned copy uses Appointment Create. Separate tracker access permission unspecified.
- Reports/lists it appears in: Planned Tracker and its printout. The underlying plan remains visible in Chart as applicable.

### Appointments > Unscheduled List
- URL: [Unscheduled List](https://opendental.com/Manual/unscheduled.html)
- Purpose (1–2 sentences): Hold canceled, missed, or otherwise unscheduled visits requiring rescheduling.
- Screen layout: Nonmodal queue, filter controls, results grid with unscheduled status and default-date setup.
- Data fields: Order by [appointment status, last/first name, creation date], Include Broken Appointments [checkbox], Provider, Site and Clinic [configured selectors], Code Range [code/range], From/To [dates], Days Past and Days Future [integer or blank], Unscheduled Status [configured via Edit Appointment].
- Actions/buttons: Refresh, Print List, Setup, Select Patient, See Chart, Send to Pinboard, or double-click to open the editor and add a commlog or stage rescheduling.
- Business rules & logic: Results are restricted to Patient status. Preferences can block recall visits or completed visits with completed procedures from entering the queue. With Appointments Require Procedures enabled, the old unscheduled appointment can be removed automatically when its procedures are booked on a new appointment. Planned visits are tracked through Planned Tracker after deleting the linked booking.
- Statuses/workflow: Scheduled → Unsched List → Scheduled. Broken may appear under the optional filter. Removal occurs after successful rescheduling.
- Links to other modules: Reads providers, clinics, sites and attached procedures. Opens Chart and sends to Pinboard.
- Permissions: Appointment Move for sending existing appointments to the queue. Appointment Edit covers deletion from this queue.
- Reports/lists it appears in: Unscheduled List and printout, patient appointment history and ASAP when flagged.

### Appointments > ASAP List
- URL: [ASAP List](https://www.opendental.com/manual/asaplist.html)
- Purpose (1–2 sentences): Find visits and recalls whose patients are willing to take an earlier opening.
- Screen layout: Nonmodal list with Appointments and Unscheduled Recalls tabs, common filters, result grids, and communication actions.
- Data fields: Provider, Clinic and Site [configured], Code Range [code/range], Appointment Status [Scheduled, Unscheduled, Planned, Broken as eligible categories], Show [All Appointments, Non-Hygiene Appointments, Hygiene Appointments], Start/End [recall due dates, default current week], Group Families [checkbox], Show Reminders [count], available date/time [datetime], SMS body [text].
- Actions/buttons: Refresh, Print List, double-click details, Select Patient, See Chart, Send to Pinboard, Remove from ASAP, Text, Web Sched ASAP Sign up/Send/History.
- Business rules & logic: Scheduled, broken, unscheduled and planned appointments may carry ASAP priority. Unscheduled Recalls can appear despite earlier reminders. Manual Text requires Integrated Texting. Without row selection, the texting workflow automatically selects rows with wireless numbers; sending writes a commlog. Web Sched Send is available when launched from an open schedule slot using Text ASAP List.
- Statuses/workflow: Normal → flagged ASAP → contacted and potentially moved earlier → clear ASAP when appropriate. Confirmation and underlying appointment status are tracked independently.
- Links to other modules: Family recall, appointment records, Chart, patient communication logs, Integrated Texting and Web Sched ASAP.
- Permissions: Separate list permission unspecified. Moving or editing uses the relevant appointment permissions, and messaging depends on the configured service.
- Reports/lists it appears in: ASAP Appointments, Unscheduled Recalls, Web Sched ASAP History and active-tab printout.

### Appointments > Status and color definitions
- URL: [Appointment Colors](https://opendental.com/Manual/definitionsappointmentcolors.html) · [Appt Confirmed](https://opendental.com/Manual/definitionsapptconfirmed.html) · [Recall / Unsched Status](https://opendental.com/Manual/definitionsrecallunschedstatus.html) · [Insurance Verification Status](https://www.opendental.com/manual/definitionsinsverify.html) · [26.3 database schema](https://www.opendental.com/OpenDentalDocumentation26-3.html)
- Purpose (1–2 sentences): Define display colors and configurable worklist states, with fixed storage values for the appointment lifecycle.
- Screen layout: Setup → Definitions category list and definition editor. Schedule consumes the colors and status names using appointment view settings.
- Data fields: Appointment Colors categories are Practice Open, Practice Closed, Appointment Complete - Background, Holiday, Blockout Text, Patient Note Background, and Completed Pt Note Background. Confirmation fields are Name [text], Abbrev [text], Hidden [checkbox], Color [picker] and per-service checkboxes for eConfirmation send/change, eReminder send, Arrivals send/response, Automated Thank-You send, eClipboard check-in change/BYOD, and General Messages send. Recall/Unsched definitions use Name and Abbreviation [text, abbreviation at most seven characters]. Insurance Verification Status uses Name [text] and Hidden [checkbox].
- Actions/buttons: Add or edit applicable definitions. Color picker selects display color. Save commits. Appointment Colors entries have fixed names and remain visible.
- Business rules & logic: Practice Open defaults white, Practice Closed gray, Complete gray, and patient-note background is described as light yellow. Broken appointments are crossed out. Provider and hygienist bars use configured provider colors, which can be overridden for the appointment background by type or individual selection. Confirmation dots use each definition's color only when Confirmed Color is added to the view. Blockout colors are type-defined, with separate text color and solid/outlined presentation. The cited help text provides color names and configurable pickers without authoritative RGB/hex values for these defaults.
- Statuses/workflow: Schema 26.3 AptStatus codes are 0 None (invalid for actual visits), 1 Scheduled, 2 Complete, 3 UnschedList, 4 ASAP (deprecated), 5 Broken, 6 Planned, 7 PtNote, and 8 PtNoteCompleted. Separate priority codes are 0 Normal and 1 ASAP. Named confirmation examples include Arrived, In Treatment Room, Front Desk, eConfirmSent, eConfirmCallBack, eConfirmFailure, and Created from Web Sched. Mailed Postcard is a documented recall outcome. Each installation can configure its own confirmation, recall/unscheduled and insurance verification lists.
- Links to other modules: Setup Definitions, Appointment Views, provider colors, Waiting Room triggers, eServices messaging, Clinic and insurance workflows.
- Permissions: Appointment Confirmation Status Edit applies to assigning confirmation values. Setup definition access is governed by configuration permissions.
- Reports/lists it appears in: Schedule, Confirmation List, Waiting Room, Recall, Planned Tracker, Unscheduled and Insurance Verification.


## Part 2 · Family


### Family > Family workspace
- URL: [Open Dental manual](https://www.opendental.com/manual/family.html)
- Purpose (1–2 sentences): Maintain patient records, households, and coverage.
- Screen layout: Family grid, photograph, Recall grid, patient summary, active plans and history, optional Clones and Super Family grids.
- Data fields: Selected patient and family member [records]; configurable patient and recall display fields; coverage order [integer].
- Actions/buttons: Add, Move, choose guarantor, Add Insurance, attach/drop Discount Plan, open patient details, referrals, payor types or insurance history by double-click.
- Business rules & logic: Add inherits contact, billing type and providers from the selected family member. Moving members can leave family financial notes in the original family. Discount Plan replaces the active insurance panel when assigned.
- Statuses/workflow: Patient status, active/dropped coverage and guarantor role are distinct.
- Links to other modules: Account uses guarantor and balances; Appointments uses recall, providers and contacts; Chart uses demographics and patient fields.
- Permissions: Family Module; individual edit permissions apply to nested dialogs.
- Reports/lists it appears in: Active Patients, New Patients, Insurance Plans, Discount Plans, Recall and referral reports.


### Family > Edit Patient Information
- URL: [Open Dental manual](https://www.opendental.com/manual/patientedit.html)
- Purpose (1–2 sentences): Edit identity, contact, financial defaults, and scheduling settings.
- Screen layout: Identity and address/contact regions with feature-dependent tabs and family relationship controls.
- Data fields: Names, middle initial, title, salutation, address, city/state/ZIP, phones, email, SSN, chart number and Medicaid ID [text]; birthdate [date]; age/patient number [derived]; early arrival [minutes]; status [Patient, NonPatient, Inactive, Archived, Deceased, Prospective; Deleted internal]; gender [Male, Female, Unknown, Other]; marital position [dropdown]; preferred pronoun [configured/None]; providers, clinic, site, billing type, language, contact/confirmation/recall preferences [selectors]; scheduling restriction and message opt-outs [checkboxes].
- Actions/buttons: Auto assigns available numeric chart number, View reveals authorized masked data, Family Relationships opens relationship editor, Save applies changes.
- Business rules & logic: Patient numbers are sequential identifiers with possible gaps. Status outside Patient disables recall, and returning to Patient re-enables it. Scheduling restriction blocks new, moved, Pinboard and eligible Web Sched bookings. Age derives from birthdate. Other gender maps to Unknown in documented claims and DoseSpot outputs.
- Statuses/workflow: Prospective or NonPatient → Patient → Inactive/Archived/Deceased as applicable; Deleted is hidden.
- Links to other modules: Feeds forms, claims, scheduling, communication, family billing and Chart summaries.
- Permissions: Patient Restriction Edit, Archived Patient Edit, Patient Birthdate View and Patient Social Security Number View for their respective controls.
- Reports/lists it appears in: Patient search and demographic, patient-status and recall reports.


### Family > Add Insurance and active plan editor
- URL: [Open Dental manual](https://www.opendental.com/manual/insplan.html)
- Purpose (1–2 sentences): Attach an existing or new insurance plan and maintain patient, subscriber and shared plan data.
- Screen layout: Patient Coverage, Subscriber Information, insurance plan details, benefit grid and tabs for additional, other insurance and ortho settings.
- Data fields: Relationship [Self, Spouse, Child, Other and supported extended relationship codes]; optional patient ID, subscriber ID, employer, carrier, payer ID, group name/number [text or pickers]; order [integer]; effective/termination, eligibility and benefits verified [dates]; Pending, Medical Insurance, Don't Verify and electronic sending flags [checkboxes]; plan type [Category Percentage, PPO Percentage, Medicaid or Flat Co-pay, Capitation]; fee, copay and out-of-network schedules [configured]; filing code, coordination options, substitution and orthodontic settings [configured or feature-dependent].
- Actions/buttons: New Plan, pick existing family/database plan, Search ID, Drop, Now, History, Ortho, Audit Trail, benefit adjustment Add, electronic eligibility and Save.
- Business rules & logic: Order determines primary/secondary/supplemental sequence. Optional Patient ID can replace subscriber ID on claims depending on medium and preference. Pending is informational. Shared plan changes can affect multiple subscribers. Drop removes patient association while retaining plan history. Effective dates matter for waiting periods.
- Statuses/workflow: Pending or verified administrative state; active → dropped; dental and medical priorities tracked separately.
- Links to other modules: Insurance Verification List writes dates, insurance benefits feed estimates and claims, orthodontic settings feed Ortho Auto Claims.
- Permissions: Insurance Plan Edit, Carrier Edit/Create, Change existing Ins Plan using Pick List, PatPlanCreate audit permission on creation.
- Reports/lists it appears in: Insurance Plans list and report, Family insurance history, insurance verification and claims.


### Family > Insurance History
- URL: [Open Dental manual](https://www.opendental.com/manual/inshistory.html)
- Purpose (1–2 sentences): Record prior service dates used in benefit frequency checks.
- Screen layout: Procedure history grid and controls for manual entry or import.
- Data fields: Procedure code [selector], service date [date], available prior dates [import source].
- Actions/buttons: Enter individually, import dates, or record applicable completed procedures.
- Business rules & logic: Prior completed services can consume frequency allowance. History can include work completed outside the practice.
- Statuses/workflow: Historical service recorded → included in applicable benefit frequency evaluation.
- Links to other modules: Insurance Plan, Treatment Plan estimates and appointment frequency checks.
- Permissions: Insurance Plan Edit for editing plan data; separate history-only permission unspecified.
- Reports/lists it appears in: Insurance Plan History and frequency-limit workflows.


### Family > Benefits and custom benefit rows
- URL: [Open Dental manual](https://www.opendental.com/Manual/benefitinfo.html)
- Purpose (1–2 sentences): Calculate insurance estimates and remaining coverage from plan benefits.
- Screen layout: Simplified view for fixed benefit families, age/frequency and other benefits grids; Row View and Edit Benefit dialog.
- Data fields: Annual max and general deductible [individual/family money]; category coverage and ortho coverage [percent]; ortho lifetime max [money]; category/code/code group [pickers]; Patient Override [checkbox]; Type [ActiveCoverage, CoInsurance, Deductible, CoPayment, Exclusions, Limitations, Waiting Period]; Percent [number], Amount [money], Time Period [Service Year, Calendar Year, Lifetime, Years, NumberInLast12Months]; Quantity [integer], Qualifier [None, Number of Services, Age Limit, Visits, Years, Months]; Coverage Level [Individual, Family, None]; Treatment Area [frequency-specific selector].
- Actions/buttons: Toggle simplified view, Add or edit benefit row, delete row, Save, recalculate claim estimates as applicable.
- Business rules & logic: Benefits generally apply across plan subscribers. Individual override supports incentive plans. Family and individual maximums and deductibles apply according to coverage level. CoPayment row is informational; functional copays use a schedule. Waiting periods require effective dates. Exclusions depend on preferences. Sent claim estimates require recalculation to reflect changes.
- Statuses/workflow: Configured annual/service-year/lifetime limits and eligibility rules; no workflow status for an individual benefit row.
- Links to other modules: Family plans, Treatment Plan estimates, Account insurance remaining, insurance history and claim procedures.
- Permissions: Insurance Plan Edit.
- Reports/lists it appears in: Benefit grid, insurance remaining, claim estimate and frequency-check screens.


### Family > Recall
- URL: [Open Dental manual](https://www.opendental.com/manual/recall.html)
- Purpose (1–2 sentences): Maintain recall intervals and follow-up settings per patient.
- Screen layout: Recalls for Patient grid and Edit Recall dialog.
- Data fields: Type [configured; read-only once existing]; interval [duration], Previous/Calculated Due/Actual Due/Schedule [dates], time-pattern override [schedule interval editor], Status [Recall / Unsched Status definitions], Schedule ASAP and Always Disabled [checkboxes], Administrative Note [text], Until Date [date], Until family balance below [money].
- Actions/buttons: Add, Edit, Set Perio/Set Prophy, Delete eligible non-Prophy/Perio history-free recall, Save.
- Business rules & logic: Trigger procedure completion or history sets previous date. Calculated due = previous date + interval. Manually different actual due survives sync. Completion resets notes and status. Editing status here does not increment reminder count.
- Statuses/workflow: Due → scheduled → completed → recalculated; temporarily or indefinitely disabled as configured.
- Links to other modules: Chart procedures, Account family balance, Recall/ASAP lists and appointment creation.
- Permissions: Family Module for entry point; dedicated recall permission unspecified on feature page.
- Reports/lists it appears in: Family Recall grid, Recall List and ASAP Unscheduled Recalls.


### Family > Discount Plans and subscriber enrollment
- URL: [Open Dental manual](https://www.opendental.com/manual/discountplans.html)
- Purpose (1–2 sentences): Configure in-house discounts and enroll patients.
- Screen layout: Master list and plan editor plus patient subscriber editor.
- Data fields: Description and Plan Note [text], Fee Schedule and Adjustment Type [configured], Annual Max [money], frequency limits [code/limit setup], Hidden [checkbox], plan ID and subscriber count [read-only], subscriber effective start/end [dates].
- Actions/buttons: Add, edit, merge, Show Hidden, pick patient plan, change/drop enrollment and inspect subscribers.
- Business rules & logic: Completed procedures can generate configured discounts. Only unused plans can be hidden. Annual and frequency limits reset on enrollment anniversary for multi-year/open-ended terms or January 1 if start is blank.
- Statuses/workflow: Visible/hidden plan; enrolled → changed or dropped.
- Links to other modules: Account and Treatment Plan display remaining benefits; Fee Schedules supply prices; adjustment definitions map ledger postings.
- Permissions: Insurance Plan Edit applies to discount plan edits.
- Reports/lists it appears in: Discount Plans list/report and patient plan panel.


### Family > Super Family
- URL: [Open Dental manual](https://www.opendental.com/manual/superfamily.html)
- Purpose (1–2 sentences): Group otherwise separate families for navigation and eligible combined billing.
- Screen layout: Super Family toolbar and configurable member grid; billing checkboxes on related screens.
- Data fields: Member/guarantor [patient picker], Included in Super Family Billing, Send to Super Family and Group by Super Family [checkboxes].
- Actions/buttons: Add family, change head/remove where applicable, select members, view group in Account and generate combined statement.
- Business rules & logic: Feature must be enabled. Each family guarantor must opt into group billing to be included in super statements/invoices.
- Statuses/workflow: Independent family → attached to group → optionally included in billing → removed if needed.
- Links to other modules: Account Show SuperFamily, Statement and Billing.
- Permissions: Family Module for entry point; billing permissions apply to batch run.
- Reports/lists it appears in: Super Family grid, statements and Billing.


### Family > Patient Clone
- URL: [Open Dental manual](https://www.opendental.com/manual/patientclone.html)
- Purpose (1–2 sentences): Create specialty-specific records associated with an original patient.
- Screen layout: Clone toolbar and grid, clone editor with provider, specialty and clinic.
- Data fields: Primary Provider [provider picker], Specialty [unused configured clinic specialties; Unspecified conditionally], Clinic [matching clinics].
- Actions/buttons: Create clone, select original/clone, synchronize demographics, and choose source for synchronization.
- Business rules & logic: Clinic choices follow specialty. Original remains the record sent to bridges. Synchronizing from a clone can normalize the original name and capitalize clone names.
- Statuses/workflow: Original → specialty clone linked → sync when needed.
- Links to other modules: Patient search, provider and clinic setup, insurance and external program bridges.
- Permissions: Feature enabled in Show Features; separate clone permission unspecified on page.
- Reports/lists it appears in: Family Clones grid.


### Family > Referrals
- URL: [Open Dental manual](https://www.opendental.com/manual/referrals.html)
- Purpose (1–2 sentences): Track inbound sources and outbound referrals for a patient or procedure.
- Screen layout: Referrals for Patient grid, master source chooser and referral attachment editor.
- Data fields: Direction [Referred From, Refer To, Refer Custom], source [configured referral or patient], procedure reference, date, notes and tracking status [attachment fields].
- Actions/buttons: Add from existing referral list, create/edit source, attach to procedure through Procedure Info, edit tracking, use Toolbar referral letters.
- Business rules & logic: Custom label can be configured and is excluded from referral reporting. Referred procedures use configurable progress-note/tooth colors. Provider referrals may trigger EHR summary and WebMail according to settings.
- Statuses/workflow: Inbound or outbound referral; referred procedure can become Existing Other after outside completion.
- Links to other modules: Chart, EHR, Patient Portal, WebMail and Toolbar Letters.
- Permissions: Family or clinical permissions apply to the entry point; consult Permissions for master referral changes.
- Reports/lists it appears in: Referral Analysis, Referral Raw, Referred Procedure Tracking and master usage counts.

## Part 3 · Account


### Account > Account workspace
- URL: [Open Dental manual](https://www.opendental.com/manual/account.html)
- Purpose (1–2 sentences): Manage the patient's financial ledger, family balances and claim history.
- Screen layout: Toolbar, family aging/insurance balances, payment plan grid, ledger, Show filters and Communications Log; optional Auto Ortho, Ortho Case and Hidden Splits views.
- Data fields: Date range [dates], family/patient selector, Show SuperFamily [checkbox], family financial/urgent notes [text], balance, estimated insurance and unearned totals [derived money]. Ledger columns and transaction colors are configurable.
- Actions/buttons: Payment and allocations, adjustments/sales tax, New Claim, payment plans, installment plans, quick procedures, repeating charges, statement/receipt/invoice, service-date view and stored-card management. Ledger context actions include supported refunds, attachments and plan-charge edits.
- Business rules & logic: Opening the account updates aging. Aging is gross; estimated insurance and write-offs are shown separately. Hidden splits can be accessed in a separate tab. Urgent family financial notes appear red. Protected claim-linked procedures and date-restricted edits have separate controls.
- Statuses/workflow: Ledger includes procedure, adjustment, payment, claim, insurance payment, plan production and plan charges; each has its own state.
- Links to other modules: Family billing and plans, Chart procedures, Manage Billing and Deposits, Imaging, merchant processing and eClipboard.
- Permissions: Account Module and action-specific edit/create permissions.
- Reports/lists it appears in: A/R aging, Daily Payments, Production and Income, Payment Plans and Unearned Income reports.


### Account > Patient Payment and paysplits
- URL: [Open Dental manual](https://www.opendental.com/manual/payment.html)
- Purpose (1–2 sentences): Record patient money and allocate it to family charges or unearned balances.
- Screen layout: Payment header, type list, current splits grid, outstanding charges and treatment-planned items with filter panels.
- Data fields: Paid By [family member], Clinic [configured], Payment Date [date], Entry Date [automatic], Amount and Surcharge Fee [money; surcharge processor-dependent], Check # and Bank-Branch [text], Note [text], Payment Type [configured or None (Income Transfer)], patients/providers/clinics [multiselect], amount min/max [money]. Splits use patient, provider, clinic, amount, linked production/plan or unearned type.
- Actions/buttons: Prepay replaces splits with default unearned split and closes; Hide/Show Splits, Add Split, Delete Splits/Delete All, allocate selected charges, supported merchant actions, Save.
- Business rules & logic: Payment amount must equal split total. Deleting a split restores the outstanding charge remainder. Date of receipt drives ledger, deposits and reports. Type selection can be mandatory. Clinic may control merchant credentials. Processor surcharge is informational for patient balance.
- Statuses/workflow: Payment entered → split or prepaid → deposited if applicable; refunds are linked negative payments where supported.
- Links to other modules: Family, procedure charges, adjustment and payment plans, payment processors, deposits and statements.
- Permissions: Payment Create; Payment Edit/Delete and associated date restrictions where applicable.
- Reports/lists it appears in: Ledger, Daily Payments, deposit slips and unearned/hidden split reports.


### Account > Claim and claim procedures
- URL: [Open Dental manual](https://www.opendental.com/manual/claimedit.html)
- Purpose (1–2 sentences): Build and manage claim headers and line-item insurance estimates and adjudication.
- Screen layout: Claim header, carrier/coverage and dates, procedures grid, payment and claim action panels, additional claim tabs.
- Data fields: Status [Unsent, Hold until Pri received, Waiting to Send, Probably Sent, Sent - Verified, Received, Hold for In Process (automatic)]; type [Primary, Secondary, Tertiary, Preauthorization, Other as applicable]; dates [service, sent, received/resend as applicable]; insurance, billing/treating/referring providers and clinic [record selectors]; correction, place of service, attachments and narrative [claim settings]; line date, provider, code, tooth, description, fee, billed, deductible, estimate, write-off, responsibility, status, finalized indicator, tracking and remarks.
- Actions/buttons: Create, Print, send, recalculate estimates, Split Claim, As Total, By Procedure, Supplemental, Batch or This Claim Only, edit line items and supported attachments.
- Business rules & logic: Unselected New Claim can pick all unbilled procedures; secondary defaults held and tertiary unsent. Additional coverage and medical claims use manual options. Printing Unsent or Waiting to Send sets Sent - Verified. In-process work holds and automatically releases to Waiting to Send after group completion. Line responsibility = fee minus paid minus write-off. Type governs available receiving actions.
- Statuses/workflow: Unsent → Waiting to Send → Probably Sent/Sent - Verified → Received. Secondary may begin held. Line states and finalized payment are tracked separately.
- Links to other modules: Family insurance, Chart procedure records, clearinghouses, Manage Send Claims, batch/ERA and account ledger.
- Permissions: Claim create/edit/delete and insurance payment permissions as applicable; plan editing is separate.
- Reports/lists it appears in: Outstanding Claims, Claims Not Sent, Procedures Not Billed, Unfinalized Payments and claim history.


### Account > Insurance payments and finalization
- URL: [Open Dental manual](https://www.opendental.com/manual/claimpayfinalize.html)
- Purpose (1–2 sentences): Post EOB details and reconcile claim payments to an actual check/EFT or other remittance.
- Screen layout: Claim Enter Payment area, line-entry grid, payment detail and attached claims grids.
- Data fields: Total paid [money] or line deductible/allowed/payment/write-off [money], payment tracking [Definitions], remarks [text]; check/reference number [text], payment date/EFT date [dates], carrier/type/clinic [selectors], EOB [document].
- Actions/buttons: As Total, By Procedure or Supplemental; move deductible, apply line write-off, mark all received, This Claim Only, Batch, attach/detach matching claims and scan EOB.
- Business rules & logic: PPO requires itemization for write-offs; Capitation excludes By Procedure. Total may be split automatically through allocation settings. Finalized payment total must reconcile to attached claims. Preferences can restrict finalization to Batch Ins. Allowed-amount edits may update configured Blue Book data.
- Statuses/workflow: Unreceived → received line(s) → unfinalized payment → finalized remittance; supplemental can post later.
- Links to other modules: Claimprocs, Manage Batch Ins, Blue Book, Imaging, Deposits and ledger.
- Permissions: Claim/payment action permissions; Allow Editing Fee Schedule While Receiving Claims and Fee Schedule Edit apply to documented allowed-fee changes.
- Reports/lists it appears in: Unfinalized Insurance Payment, Daily Payments, deposits and EOB detail.


### Account > Patient Payment Plans
- URL: [Open Dental manual](https://www.opendental.com/manual/paymentplandynamic.html)
- Purpose (1–2 sentences): Amortize a patient's selected treatment or adjustments over a repayment agreement.
- Screen layout: Terms, linked production, totals, amortization schedule and payment/signed-plan controls.
- Data fields: Guarantor [patient], plan date/first payment/interest start [dates], APR [%], no-interest payment count [integer], down/payment amounts [money], number of payments [integer], frequency [Weekly, Every other week, Specific day of the month, Monthly, Quarterly], planned procedure handling [Await procedure completion, Procedure as complete], production amount overrides [money], notes and signature.
- Actions/buttons: Link/unlink procedures and adjustments, pick template, calculate terms, show detail, print/sign, close or delete when allowed.
- Business rules & logic: Payment amount and count calculate from each other. Scheduled due dates follow the chosen recurrence. Production, estimates and adjustments can dynamically affect totals. Same-date charges are grouped unless detail is on. Signed plans can archive to Imaging when configured.
- Statuses/workflow: Create → active with scheduled charges → paid/closed, with open balances tracked in reports.
- Links to other modules: Chart, estimates, Account splits, Imaging and payment plan templates.
- Permissions: Payment Plan action permissions and date restrictions in Permissions catalog.
- Reports/lists it appears in: Payment Plans, Payment Plans Overcharged, account plan grid and ledger.


### Account > Insurance Payment Plans
- URL: [Open Dental manual](https://www.opendental.com/manual/paymentplanins.html)
- Purpose (1–2 sentences): Track a carrier repayment schedule such as orthodontic installments.
- Screen layout: Plan header/terms, linked completed production or claim context, amortization schedule, and charge editor.
- Data fields: Insurance plan/subscriber, provider/clinic [selectors], plan and first-payment dates, payment amount/count, APR and interest grace/start, down payment, manual charge date, principal and note. Derived interest and charge audit times are read-only.
- Actions/buttons: Create, calculate, link, edit eligible charge, print, close and post insurance payments through claim workflow.
- Business rules & logic: Expected installments are tracked separately from received claim payments. Interest derives from principal and terms. Existing down-payment rows cannot be edited as ordinary charges.
- Statuses/workflow: Expected → received against plan → current/past due → closed.
- Links to other modules: Claims, received insurance payments, ledger and provider/clinic assignment.
- Permissions: Insurance/payment plan permissions as applicable.
- Reports/lists it appears in: Insurance Payment Plans Past Due, Account plan grid and related claims.


### Account > Repeating Charges
- URL: [Open Dental manual](https://www.opendental.com/manual/repeatingcharges.html)
- Purpose (1–2 sentences): Schedule procedure-based account charges that repeat monthly.
- Screen layout: Patient Repeating Charge setup and practice-wide batch tool.
- Data fields: Procedure code [configured], charge [money], start/stop [dates], note [text], scheduling and feature options as configured.
- Actions/buttons: Add/edit recurrence; run generated charges from Tools; view existing and generated items.
- Business rules & logic: Recurring entries generate dated ledger procedures under the monthly process and configured stop conditions. A repeating charge is distinct from a recurring card payment.
- Statuses/workflow: Active recurrence → monthly posted charges → ends on stop date or after change.
- Links to other modules: Procedure Codes, ledger, billing and Scheduled Processes where configured.
- Permissions: Setup commonly controls batch tool access; feature availability depends on settings.
- Reports/lists it appears in: Account Repeating Charges and Tools batch history/output.


### Account > Statements, receipts and invoices
- URL: [Open Dental manual](https://www.opendental.com/manual/statementwindow.html)
- Purpose (1–2 sentences): Generate and distribute records of account activity or payments.
- Screen layout: Statement setup dialog, preview and saved output; batch Billing path and toolbar quick variants.
- Data fields: Date, From/To [dates], Mode [delivery selection], Sent, Hide payment options, Single patient only, Intermingle family members, Receipt, Send Text Message, Since zero/negative balance, Send to Super Family, Include Patient Last Name and Export as CSV [checkboxes]; Note/Bold Note [text]; invoice/limited indicators and invoice number [derived].
- Actions/buttons: View, Print, Email with PDF, Pat Portal, Save, Delete; ledger selection enables Limited Statement; toolbar offers immediate options.
- Business rules & logic: Blank bounds include all transactions. Since zero/negative overrides entered dates. StatementAging remains family-based even in single-patient mode. Super Family opt-in controls group eligibility. Print/email marks Sent. Bold Note is red. Sent print action opens PDF. Portal requires shared statement category and configured access.
- Statuses/workflow: Prepared → previewed → Sent/archived when applicable.
- Links to other modules: Billing defaults, Sheets, Imaging, Patient Portal, email and Family/Super Family.
- Permissions: Export CSV for CSV option; Image Delete for deleting saved image copies.
- Reports/lists it appears in: Ledger statement rows, Billing List, Imaging statement category and portal.


### Account > Unearned income and prepayments
- URL: [Open Dental manual](https://www.opendental.com/manual/unearnedprepayment.html)
- Purpose (1–2 sentences): Hold money before it is earned or tied to a specific charge.
- Screen layout: Account Unearned total, Payment splits editor, and Allocate Unearned window.
- Data fields: Unearned type [Definitions, including configured hidden types]; patient/provider/clinic [selectors], source and destination splits, amount [money].
- Actions/buttons: Prepay, enter unearned split, view unearned detail, allocate to eligible production or transfer, and view hidden splits where applicable.
- Business rules & logic: Unearned total sums applicable family splits by type. An allocation creates offsetting and destination splits, moving value from unearned to production without collecting money again. Hidden types may be omitted from the normal ledger.
- Statuses/workflow: Collected → held as unearned → allocated, transferred or refunded.
- Links to other modules: Account, planned/completed production, reports and provider attribution.
- Permissions: Payment permission and relevant allocation settings; report access is separate.
- Reports/lists it appears in: Unearned Income reports and Hidden Payment Splits.


### Account > Income Transfer
- URL: [Open Dental manual](https://www.opendental.com/manual/incometransfer.html)
- Purpose (1–2 sentences): Reallocate money among charges, providers, patients or clinics without changing total cash.
- Screen layout: Manual payment-split editor or automatic transfer workflow with offsetting entries.
- Data fields: Transfer date, note, patient/provider/clinic, amount, target procedure/adjustment/payment plan, unearned type; Payment Type None (Income Transfer).
- Actions/buttons: Create automatic transfer or manually build negative source and positive destination splits; Attach links production; Save posts transfer.
- Business rules & logic: Net transfer is zero. Linked procedure or adjustment inherits provider and clinic. Allocation policies influence suggestions. Transfer can recognize earned income when applied to production.
- Statuses/workflow: Existing credit/allocation → offset → new target allocation.
- Links to other modules: Family balance, patient payments, provider income, procedures, adjustments and plans.
- Permissions: Payment permissions and allocations configuration.
- Reports/lists it appears in: Ledger, provider income reporting and Unearned Income reports.

## Part 4 · Treatment Plan and Chart


### Treatment Plan > Treatment Plan workspace
- URL: [Open Dental manual](https://www.opendental.com/manual/treatmentplan.html)
- Purpose (1–2 sentences): Prioritize treatment, compare estimates and present plans.
- Screen layout: Treatment Plans grid, action toolbar, procedure/priority grid, sorting and output options, preauthorizations, insurance/discount remaining and notes.
- Data fields: Plan [Active, Inactive, Saved]; procedure checkbox selection; priority [configured up to seven characters]; estimates as of [date]; note [text]; grid supports date/order, code, tooth/surface, fees, insurance and patient portion, write-off, prognosis and appointment indicators.
- Actions/buttons: New TP, Save TP, Preauthorization, Discount, Update Fees, LabCase, Consent, Print TP, eClipboard and Plan Appt.
- Business rules & logic: Active plan supplies chart and appointment defaults. Estimates normally consider first two insurance plans; additional estimates remain on Procedure Info. Preauthorization claim lines do not directly feed plan totals. Configurable priority color may affect rendering.
- Statuses/workflow: Active, Inactive, Saved; appointment flags include P (planned) and U (unscheduled).
- Links to other modules: Chart, appointments, insurance benefits, Fee Tools, Imaging and Sheets.
- Permissions: Treatment Plan Module and action-specific permissions.
- Reports/lists it appears in: Treatment plan presentation statistics, presented production and Treatment Finder.


### Treatment Plan > Edit, save and present plans
- URL: [Open Dental manual](https://www.opendental.com/manual/treatmentplanedit.html)
- Purpose (1–2 sentences): Maintain current or alternate options and persist a presentation snapshot.
- Screen layout: Plan identity and procedure selection, saved-plan details and signature/output controls.
- Data fields: Heading/note [text], status [active/inactive/saved as determined by workflow], procedure selection, signature and displayed fees/estimates.
- Actions/buttons: Create alternate plan, move/include procedures, activate eligible plan, save presentation, print/sign and open saved details.
- Business rules & logic: An alternate plan can reuse or contain distinct planned procedures. Saved plans represent the presented snapshot. Future fee and estimate updates target active/inactive treatment according to the tool used.
- Statuses/workflow: Active or Inactive → Saved snapshot; signatures track presentation acceptance where used.
- Links to other modules: Chart, Imaging PDF, eClipboard and Sheets layout.
- Permissions: Treatment Plan access and action-specific permissions.
- Reports/lists it appears in: Treatment Plan list and presentation reports.


### Treatment Plan > Preauthorization and procedure discounts
- URL: [Open Dental manual](https://www.opendental.com/manual/preauth.html)
- Purpose (1–2 sentences): Submit a proposed treatment request or reduce proposed patient fees using procedure discounts.
- Screen layout: Selected treatment grid, preauthorization claim editor and separate discount dialog.
- Data fields: Procedures and insurance [pickers]; claim details; procedure discount [money or percent as supported]; selected rows [multi-select].
- Actions/buttons: Create Preauthorization; send/print and record response; apply selected-procedure discount and recalculate.
- Business rules & logic: Preauthorization is a claim type for proposed work. Treatment Plan uses insurance estimate claimprocs for totals. Discounts feed patient portion calculations.
- Statuses/workflow: Proposed → preauthorization sent → response recorded; treatment status remains independent.
- Links to other modules: Account Claims, clearinghouses, benefit estimates and discounts.
- Permissions: Claim and treatment-plan action permissions.
- Reports/lists it appears in: Preauthorizations list and presented treatment reports.


### Chart > Chart workspace and Progress Notes
- URL: [Open Dental manual](https://www.opendental.com/manual/chart.html)
- Purpose (1–2 sentences): Enter and review clinical history, restorations, notes and attachments.
- Screen layout: Toolbar, graphical tooth chart and timeline, Enter Treatment/Missing/Movements/Planned Appts/Show/Draw/Ortho tabs, patient/medical summary, Progress Notes and image category tabs.
- Data fields: Time slider; odontogram note [text], chart view [configured], procedure and object filters and date/search; configurable chart columns and image tabs.
- Actions/buttons: Print notes, New Rx/Rx Manage/eRx, LabCase, Perio, Ortho, Consent, Tooth Chart Show Big or Save to Images, Exam Sheet, CCD, EHR, Layout and bridge actions. Context menus edit or group eligible notes and procedures.
- Business rules & logic: Chart timeline reflects treatment history. Odontogram note has no version history. Medical block defaults pink/light red. Completed or Existing Complete rows can use provider color. Chart layout selection is user-specific.
- Statuses/workflow: Treatment planned, completed, existing, referred and conditions are independently filterable.
- Links to other modules: Treatment Plan, Account, Appointments, Imaging, EHR and patient forms.
- Permissions: Chart Module; item-specific chart, procedure, note, image and prescription rights.
- Reports/lists it appears in: Progress Notes printouts, Incomplete Procedure Notes and chart views.


### Chart > Enter Treatment
- URL: [Open Dental manual](https://www.opendental.com/manual/entertreatment.html)
- Purpose (1–2 sentences): Chart procedures, conditions and tooth surfaces.
- Screen layout: Tooth chart selection, surface buttons, status and diagnosis controls, procedure and quick-code entry.
- Data fields: Surfaces [B/F, V, M, O/I, D, L]; Entry Status [TreatPlan, Complete, ExistCurProv, ExistOther, Referred, Condition]; Date [date], Today [checkbox], Diagnosis/Prognosis/Priority [Definitions], Procedure Code [text/picker], Treatment Plans [checkbox when TP view enabled].
- Actions/buttons: Toggle surfaces, choose code via selector/category/quick button, type code, enter condition or diagnosis, display treatment plans.
- Business rules & logic: D prefix can be omitted when typing D codes. Charting Complete creates a billable account entry. Existing procedures carry no fee. TreatPlan creates TP or TPi based on active plan membership. One diagnosis and one prognosis per procedure.
- Statuses/workflow: TP/TPi → Complete (C); Referred (R) → Existing Other (EO) when finished elsewhere; Existing Current (EC) and Condition (Cn) are distinct.
- Links to other modules: Procedure Codes, Definitions, Account, Treatment Plan, Appointments and referral tracking.
- Permissions: Procedure create/edit permissions by status, including Create Completed Procedure (or set complete).
- Reports/lists it appears in: Chart, Treatment Plan, procedure reports and referral tracking.


### Chart > Perio Chart
- URL: [Open Dental manual](https://www.opendental.com/manual/perio.html)
- Purpose (1–2 sentences): Record periodontal measurements and compare exams.
- Screen layout: Dated exam selector, tooth/surface measurement grid, graphical display and keyboard/voice entry controls.
- Data fields: Exam date [date]; probing and gingival-margin measurements, mobility, furcation, plaque, calculus, bleeding and suppuration [numeric or marker controls]; direction [Forward, Reverse]; Triplets and Ging Marg+ [checkboxes]; tooth/site selection.
- Actions/buttons: Add exam, copy, edit/delete as allowed, print, navigate cells and toggle direction, microphone for voice charting where supported.
- Business rules & logic: Triplets applies common entries across three sites. Ging Marg+ enables positive values. Cloud excludes documented voice charting. Missing teeth affect charted sites.
- Statuses/workflow: Exam created → measured → edited, copied or compared.
- Links to other modules: Tooth chart/missing teeth, patient clinical record and voice configuration.
- Permissions: Perio Chart Edit; Perio Chart Copy additionally for copying.
- Reports/lists it appears in: Patient Perio exams and printouts.


### Chart > Ortho Chart and hardware
- URL: [Open Dental manual](https://www.opendental.com/manual/orthochart.html)
- Purpose (1–2 sentences): Maintain dated orthodontic notes, signatures and hardware displays.
- Screen layout: Configurable tabs/columns with dated notes, signature area, date filter and audit; Ortho tab also offers Hardware and exam views.
- Data fields: Date/time, optional Provider [dropdown], note cells [configured], signature, date range; hardware list and Show Graphics/Hidden/Ortho grids/Tooth chart ortho mode [checkboxes].
- Actions/buttons: Add Row, Today/Now, Auto Note, Change User, Delete, Audit Trail, Print, Take Control; Ortho hardware Add Single, Prescriptions, Hide/Unhide, Copy and Delete.
- Business rules & logic: Shared columns populate across tabs for the same date. Take Control unlocks editing from another user session. Adding or copying hardware creates today's exam when needed. Printed width is limited to columns in the first 915 pixels.
- Statuses/workflow: Unsigned → signed; shown/hidden hardware independent of note signing.
- Links to other modules: Chart, Appointment context menu, electronic signature and Ortho setup.
- Permissions: Ortho Chart Edit (full) or Ortho Chart Edit (same user, signed), with more limited access under the latter.
- Reports/lists it appears in: Ortho Chart tabs, Progress Notes as configured and the Ortho Chart Audit Trail.


### Chart > Graphical Tooth Chart and tooth controls
- URL: [Open Dental manual](https://www.opendental.com/manual/graphicaltoothchart.html)
- Purpose (1–2 sentences): Visualize tooth and surface history, record dentition and add annotations.
- Screen layout: Odontogram, history slider, optional large viewer, Missing/Primary, Movements and Draw tabs.
- Data fields: Tooth nomenclature [Universal, FDI, Palmer, Haderup]; tooth/surface [selection]; dentition [Primary, Permanent, Mixed], tooth visibility [Missing, Not Missing, Hidden]; shift in mm, rotation and tips [numeric]; draw mode [Pointer, Move Text, Pen, Eraser, Change Color], color [configured or custom], text [annotation].
- Actions/buttons: Select teeth or drag, mark/unhide, Edentulous, set all primary/permanent or mixed, apply/clear movements, draw/text edit, Show Big and Save to Images.
- Business rules & logic: Universal uses 1–32/A–T; supernumerary adds 50 or S. Ortho mode uses Palmer. Movement can represent unerupted teeth. Paint Type and procedure status/material/color override determine graphics. Saved chart goes to configured image category.
- Statuses/workflow: Present, missing, hidden or unerupted; procedures use chart status and configured colors. Metal convention dark and ceramic/porcelain/plastic light.
- Links to other modules: Procedure Codes, Definitions chart colors, Perio and Imaging.
- Permissions: Chart access plus image creation and applicable edit permissions.
- Reports/lists it appears in: Chart, printed treatment plans where configured and Imaging graphical chart category.


### Chart > Medical
- URL: [Open Dental manual](https://www.opendental.com/manual/medical.html)
- Purpose (1–2 sentences): Document clinically relevant problems, medications, allergies and alerts.
- Screen layout: Problems, Medications, Allergies and optional EHR tabs for family history, vitals and tobacco; narrative/flag region.
- Data fields: Premedicate and Current Meds Documented [checkboxes], Med Urgent, Medical Summary, Service Notes and Medical History [text]; related diagnosis, medication and allergy pickers; EHR vitals include pulse, height, weight and blood pressure.
- Actions/buttons: Add/edit related list entries, document medical notes, Print Medical and Save.
- Business rules & logic: Premedicate and Med Urgent can show in bold red; placement on appointment cards/bubbles depends on display settings. Medical History text is not archived by this field. Medical print is a single page.
- Statuses/workflow: Active/inactive problems and allergies; current/discontinued medications; premedicate yes/no.
- Links to other modules: Appointments, EHR, master medical lists, Chart and Rx.
- Permissions: Pat Medication List Edit, Pat Allergy List Edit, Pat Problem List Edit.
- Reports/lists it appears in: Medical summary, chart flags, appointment view and printout.


### Chart > Rx and eRx
- URL: [Open Dental manual](https://www.opendental.com/manual/rx.html)
- Purpose (1–2 sentences): Create, print or transmit prescriptions.
- Screen layout: New Rx editor, preset selector, Rx Manage list and optional external eRx interface.
- Data fields: Drug, dosage/strength instructions, Sig, Dispense, Refills and Notes [entry fields]; date, provider, pharmacy, prescription template and controlled-substance controls as supported.
- Actions/buttons: Pick template, complete Rx, Print, manage multiple prescriptions or open configured eRx; proxy can select provider before DoseSpot launch.
- Business rules & logic: Template populates fields. Electronic behavior depends on enabled integration. Chart records prescription activity. Permissions and provider setup gate creation and editing.
- Statuses/workflow: Draft → saved/printed or transmitted through configured service.
- Links to other modules: Pharmacies and Prescription master lists, DoseSpot/Ensora, Chart and patient medical data.
- Permissions: Rx Create and Rx Edit.
- Reports/lists it appears in: Prescriptions Report, Progress Notes and Rx Manage.


### Chart > Exam Sheet
- URL: [Open Dental manual](https://www.opendental.com/manual/examsheets.html)
- Purpose (1–2 sentences): Create a structured clinical exam using a configured sheet.
- Screen layout: Dated exam grid, Show Types Filter, read-only preview, and template chooser/editor.
- Data fields: Type and sheet [configured], Search [text], date and template-defined text/checkbox/signature inputs.
- Actions/buttons: Setup opens Sheets; Add starts a new exam; choose/search template; highlight preview; double-click to edit.
- Business rules & logic: Template controls input and output layout. Existing record preview follows selection.
- Statuses/workflow: Created → filled → saved, and signed where template supports it.
- Links to other modules: Sheets definitions, patient chart and related document outputs.
- Permissions: Sheet and chart access/edit permissions as applicable; separate exam-specific permission unspecified on page.
- Reports/lists it appears in: Patient Exam Sheets grid and chart-related output.

## Part 5 · Imaging and Manage


### Imaging > Imaging workspace
- URL: [Open Dental manual](https://www.opendental.com/manual/images.html)
- Purpose (1–2 sentences): Store and work with clinical images, radiographs, PDFs and other patient documents.
- Screen layout: Image category tree, preview pane, acquisition/file toolbar, image processing tools, unmounted strip and detachable viewer.
- Data fields: Image category [configured], file and folder [path], scan mode [Document, Multi-Page Document, Radiograph, Photo], zoom and windowing [numeric/sliders], transform and monitor options, notes and signature.
- Actions/buttons: Print current or category, Delete, Info, Sign, Scan, Mount/Acquire, Video, Import/Auto Import, Export/Move to Patient/Export TIFF, Copy/Paste, Forms, Fit/Fit 1/100, Crop, Pan, Adjust, rotations/flip, Draw, Unmount/Remount/Retake and docking actions.
- Business rules & logic: Single scans save JPEG and ADF multi-page scans PDF. Current category wins for import, then configured default, then first category. Crop/rotation affect display and preserve originals. DICOM export uses original; normal TIFF export creates JPEG. Newer electronic signatures invalidate on document modification. PDF viewer uses WebView2 unless external viewer preference applies.
- Statuses/workflow: Acquired/imported → categorized → edited/signed/exported; mounted or unmounted as applicable.
- Links to other modules: Chart thumbnails and saved tooth charts, EOBs, signed plans, lab slips, portal-shared folders and A to Z storage.
- Permissions: Imaging Module, Image Create, Image Delete, Image Edit, Image Export.
- Reports/lists it appears in: Image category tree, thumbnail tabs, task search and shared portal folders.


### Imaging > Image Info, mounts and category setup
- URL: [Open Dental manual](https://www.opendental.com/manual/imageinfo.html)
- Purpose (1–2 sentences): Maintain search/display metadata and organize acquisition templates.
- Screen layout: Item Info and Mount Info dialogs; categories and template definitions are managed in Setup.
- Data fields: Description, date/time, Image Category [configured], Type [image/document classification], tooth reference and related notes/metadata; mount template and positions [configured].
- Actions/buttons: Edit metadata, move between categories, select acquisition device/mount, capture slots, retake, unmount and remount.
- Business rules & logic: Categories control Chart visibility, thumbnails, portal sharing and special document destinations. Device setup and compatible sensors determine acquisition. Template slot placement guides sequential capture.
- Statuses/workflow: Unassigned/mounted image placements; category visibility depends on definition.
- Links to other modules: Mount Definitions, Imaging Devices, Chart, Treatment Plan, Account and Patient Portal.
- Permissions: Image Create/Edit; Setup applies to configuration as appropriate.
- Reports/lists it appears in: Mounts, Image Categories and related patient files.


### Imaging > Enhancement, annotations and video
- URL: [Open Dental manual](https://www.opendental.com/manual/draw.html)
- Purpose (1–2 sentences): Adjust image presentation and annotate or capture clinical media.
- Screen layout: Image toolbar, Draw controls and live video capture window.
- Data fields: Windowing, zoom, orientation and crop [sliders/numbers], color [picker], freehand/text/line/measurement controls, video device [configured].
- Actions/buttons: Apply display changes, draw and erase, add text and measurements, capture from live feed and save.
- Business rules & logic: Image transformations preserve source file. Measurement accuracy depends on calibration. Capture requires compatible device and documented support/registration conditions.
- Statuses/workflow: Display edits applied independently of source; captured image enters patient storage.
- Links to other modules: Sensor/device setup, mount acquisition and clinical Chart.
- Permissions: Image Create/Edit.
- Reports/lists it appears in: Imaging previews and supported outputs.


### Manage > Manage workspace
- URL: [Open Dental manual](https://www.opendental.com/manual/manage.html)
- Purpose (1–2 sentences): Run office-wide batch, financial and administrative tasks.
- Screen layout: Office toolbar, time clock and messaging controls.
- Data fields: Current employee and selected messaging button; batch settings are entered on launched dialogs.
- Actions/buttons: Send Claims, Batch Ins, Billing, Deposits, Supply Inventory, TSI Collections, Tasks, Backup, Accounting, Email Inbox, ERAs, and optional Import Ins Plans; clock actions and internal signaling.
- Business rules & logic: Public Health toggles 834 import visibility. Each action has its own queue/filter and permissions. Multiple task lists can remain open.
- Statuses/workflow: No module-wide workflow state; dispatched actions maintain own status.
- Links to other modules: Account, insurance, scheduling, supplies, email, staff and reporting.
- Permissions: Manage Module and action permissions for destinations.
- Reports/lists it appears in: Batch claims, insurance, billing, deposits, accounting and staff views.


### Manage > Send Claims
- URL: [Open Dental manual](https://www.opendental.com/manual/claimsend.html)
- Purpose (1–2 sentences): Send or print queued insurance claims and inspect submission history.
- Screen layout: Waiting queue, claim history and clearinghouse controls.
- Data fields: Clinic and clearinghouse [configured], claim row selection; submission and history filters [date/status criteria].
- Actions/buttons: Send selected or queued claims, print, inspect claim and clearinghouse responses, view history.
- Business rules & logic: Clearinghouse/clinic routes control transmission. Paper and electronic claims use distinct output paths. Review transmission validation and acknowledgments before treating delivery as verified.
- Statuses/workflow: Waiting to Send → sent/verified or requires correction; received state comes from adjudication.
- Links to other modules: Account claim editor, clearinghouse reports and attachments.
- Permissions: Manage access and applicable claim permissions.
- Reports/lists it appears in: Waiting claims, claim history, claims not sent, outstanding claims.


### Manage > Batch Insurance Payments
- URL: [Open Dental manual](https://www.opendental.com/manual/claimpaymentbatch.html)
- Purpose (1–2 sentences): Receive and reconcile several claims to one remittance.
- Screen layout: Batch list, EOB/payment header, search and attached claim rows with totals.
- Data fields: Payment date [date], amount [money], carrier, clinic, payment type [configured], check/EFT references and notes [text], claim filters and selection.
- Actions/buttons: New/edit batch, search/attach claim, enter receipt, detach incorrectly included claims, attach EOB, save or return later.
- Business rules & logic: Payment finalizes when posted claim amounts reconcile to total. Batch-only preference can route all finalizations here.
- Statuses/workflow: Open/unfinalized → reconciled/finalized.
- Links to other modules: Account claimprocs, EOB imaging, Deposits and insurance payments.
- Permissions: Manage and applicable insurance payment rights.
- Reports/lists it appears in: Batch Ins, EOB and Unfinalized Insurance Payment.


### Manage > Electronic Remittance Advice (ERAs)
- URL: [Open Dental manual](https://www.opendental.com/manual/claimsera835.html)
- Purpose (1–2 sentences): Review and post insurer 835 remittances.
- Screen layout: ERA list and filters, remittance detail and matched claim views.
- Data fields: From/To [dates], Amount Min/Max [money], optional Control ID [text], Carrier [partial-name text], Check # or EFT Trace # [text], Clinic [selector], Status [Unprocessed, Partial, Not Finalized, Finalized], Automatable Carriers Only [checkbox]. Grid includes patient or claim count, carrier, status, date, amount, clinic, code, optional Control ID and note. Payment codes are ACH, CHK, NON, FWT and BOP.
- Actions/buttons: Retrieve/import where configured, open remittance, match or review claim lines, process payment and inspect errors.
- Business rules & logic: ERA delivery depends on clearinghouse configuration. Matching and reconciliation govern posting. Automation can process qualifying files according to setup.
- Statuses/workflow: Unprocessed → Partial if some claims are received → Not Finalized when all are received → Finalized. Asterisk after Finalized indicates detached claims. Default filters show the last seven days and exclude Finalized.
- Links to other modules: Claims, claim payments, payment tracking, clearinghouse and account ledger.
- Permissions: Manage access and payment permissions as applicable.
- Reports/lists it appears in: ERA queue, ERAs Automatically Processed and unfinalized payments.


### Manage > Batch Billing
- URL: [Open Dental manual](https://www.opendental.com/manual/billing.html)
- Purpose (1–2 sentences): Prepare and send a batch of patient statements.
- Screen layout: Billing defaults, filters and Billing List, statement and delivery panels.
- Data fields: Billing type, clinics/providers as available [configured], dates and balance filters, group by Super Family [checkbox], statement delivery options.
- Actions/buttons: Generate list, preview/modify statements, print, email or send using supported delivery methods, open defaults.
- Business rules & logic: Eligibility and delivery depend on billing defaults and patient settings. Grouping honors family billing participation. Statement forms use Sheet templates.
- Statuses/workflow: Prepared batch → selected → delivered/marked sent.
- Links to other modules: Account, Family, statement templates, Imaging and Patient Portal.
- Permissions: Billing.
- Reports/lists it appears in: Billing List, saved statements and ledger.


### Manage > Deposit Slips
- URL: [Open Dental manual](https://www.opendental.com/manual/depositslip.html)
- Purpose (1–2 sentences): Group eligible payments into a bank deposit and print its slip.
- Screen layout: Deposit list and editor with available and attached payment grids.
- Data fields: Deposit date [date], bank/account fields and clinic [configured], payment selection and totals [money].
- Actions/buttons: Add deposit, select or remove payments, edit, print and save.
- Business rules & logic: Deposit links underlying payment rows. Clinic/payment type and date filtering affect candidate rows. Accounting integration can record linked activity.
- Statuses/workflow: Available payment → assigned to deposit → printed/recorded.
- Links to other modules: Account Payments, insurance remittances and optional Accounting.
- Permissions: Deposit Slips, with date restrictions.
- Reports/lists it appears in: Deposits and payment reports.


### Manage > Supplies, Time Clock and Messaging
- URL: [Open Dental manual](https://www.opendental.com/manual/supplyinventory.html)
- Purpose (1–2 sentences): Track supplies and staff operations through separate windows and module controls.
- Screen layout: Supply/supplier/order inventory tabs, clock actions and office messaging buttons.
- Data fields: Supplier/item/order records, inventory and quantities [numeric], costs [money], employee and clock-in/out times, configured message target/button.
- Actions/buttons: Open inventory, add/edit suppliers/items/orders; use clock in/out and break controls; click configured office signal.
- Business rules & logic: Time clock associates records with employee account. Messaging distributes configured text/light/sound signals. Supply and time-card workflows are independent.
- Statuses/workflow: Order and inventory tracking, clocked in/out or on break, message sent.
- Links to other modules: Employee setup, Time Cards and Messaging definitions.
- Permissions: Manage access; time and configuration permissions as applicable.
- Reports/lists it appears in: Supply orders and time cards.


### Manage > Accounting, Email Inbox, Tasks and Backup
- URL: [Open Dental manual](https://www.opendental.com/manual/manage.html)
- Purpose (1–2 sentences): Launch office-wide bookkeeping, email, task and backup tools.
- Screen layout: Chart of accounts/register, email folders/grid and message preview, task list tree, and backup dialog.
- Data fields: Account type and dates, debit/credit amounts, message account/folder, task lists/status and backup path/options.
- Actions/buttons: Open account/register, add entries, receive/reply to email, open/subscription task lists, run permitted backup.
- Business rules & logic: Accounting links can connect payments and deposits. Email requires configured account. Backups depend on deployment and storage setup.
- Statuses/workflow: Transaction recorded; email received/sent; task open/done; backup run result.
- Links to other modules: Account, Deposits, Toolbar workflows and data paths.
- Permissions: Accounting, Accounting Create Entry, Accounting Edit Entry, Backup and applicable email/task access.
- Reports/lists it appears in: General Ledger Detail, Balance Sheet, inbox, task lists and backup output.


## Part 6 · Main Menu


### Setup > Setup navigation and shared configuration
- URL: [Open Dental manual](https://www.opendental.com/manual/mainmenu.html)
- Purpose (1–2 sentences): Open application-wide configuration by module or subsystem.
- Screen layout: Appointments, Family/Insurance, Account, Chart, Images, Manage, Advanced Setup and other actions.
- Data fields: Menu destinations [configuration-dependent]; settings live in each destination.
- Actions/buttons: Open Appointment Fields/Rules/Types/Views, ASAP/Confirmation/Verification/Recall, Operatories; claim forms, clearinghouses, Blue Book, categories/filing codes, patient fields and payer IDs; Allocations and Templates; EHR/Procedure Buttons; device/scanner/mount setup; email/messaging/time cards; API, Computers, HL7/HIE, Replication, Show Features and Scheduled Processes; Preferences, Definitions, Display Fields, fee and schedule controls, Sheets, Security, Program Links, Tasks and Web Forms.
- Business rules & logic: Feature toggles and permission grants affect menu visibility and controls. Site, clinic, provider, user or workstation scoping varies by feature.
- Statuses/workflow: Configuration saved → consumed by relevant workflow.
- Links to other modules: All modules and shared administrative functions.
- Permissions: Most destinations require Setup; specific rights apply for securities and fee schedules.
- Reports/lists it appears in: Setup and configuration lists.


### Setup > Fee Schedules
- URL: [Open Dental manual](https://www.opendental.com/manual/feeschedules.html)
- Purpose (1–2 sentences): Define procedure fee schedules for UCR, contracted, out-of-network and other pricing.
- Screen layout: Schedule list, type/hidden filters, selected-row editor and fee audit/cleanup controls.
- Data fields: Description [text], Type [Normal, CoPay, OutNetwork], Hidden and global/clinic/provider behavior [checkboxes], schedule filters and order.
- Actions/buttons: Add or edit, Up/Down, Set Order, Sort, Show Hidden, Clean Up Allowed, Hide Unused and Check Ins Plan Fee Schedules Go.
- Business rules & logic: Schedule can use global or clinic/provider-specific entries. Sort requires all types. Cleanup identifies eligible unused or hidden-plan out-of-network schedules.
- Statuses/workflow: Active/hidden schedule; fee rows scoped by procedure, clinic and provider where supported.
- Links to other modules: Procedure Codes, providers, insurance plans, discount plans and Treatment Plan.
- Permissions: Edit Fee Schedule; Security Admin for cleanup/hide-unused controls.
- Reports/lists it appears in: Procedure Codes - Fee Schedules Report and Check Insurance Plan Fees.


### Setup > Fee Tools
- URL: [Open Dental manual](https://www.opendental.com/manual/feescheduletools.html)
- Purpose (1–2 sentences): Bulk edit, import/export or refresh fee and estimate data.
- Screen layout: Select Fees and Copy To selectors, file/bulk tools and Global Updates panel.
- Data fields: Fee schedule, clinic or Enterprise group, provider [configured], percentage [number], input/output file path, global clinic selection.
- Actions/buttons: Copy, Export, Import, Import Canada where available, Clear, Increase by %, Update Proc Fees Only, Update Estimates Only; pause/cancel estimates as supported.
- Business rules & logic: Import uses tab-delimited data. Clear warns. Procedure updates affect active/inactive planned work and preserve saved plan fees. Estimate refresh recalculates write-offs, ortho and discount values and can touch all clinics.
- Statuses/workflow: Selected fees → copied/imported/modified/cleared; fee and estimate refresh are separate operations.
- Links to other modules: Procedure Codes, fee schedules, Treatment Plan, discount and insurance calculations.
- Permissions: Fee schedule edit rights for fee changes; applicable setup permissions.
- Reports/lists it appears in: Fee schedules and treatment estimate displays.


### Setup > Schedule Setup
- URL: [Open Dental manual](https://www.opendental.com/manual/schedule.html)
- Purpose (1–2 sentences): Define provider, employee and office working time and holidays.
- Screen layout: Schedule calendar and dated entries; schedule editor, day/week copy and filters.
- Data fields: Date range [dates], clinic/provider/employee and operatory [configured], start/stop [times], notes and holiday labels [text], repeat/copy settings.
- Actions/buttons: Add/edit schedule, select operatories, copy/paste day or week, repeat patterns and clear selected scope where available.
- Business rules & logic: Appointment search depends on populated future schedules. Provider and operatory assignments determine availability; holidays influence lab due dates.
- Statuses/workflow: Open/closed, scheduled/off and holiday slots.
- Links to other modules: Appointments, Pinboard search, Lab Cases, Web Sched and employee hours.
- Permissions: Schedule editing permissions and clinic/access restrictions as applicable.
- Reports/lists it appears in: Schedule grid, Appointments provider/employee tabs and openings.


### Setup > Security
- URL: [Open Dental manual](https://www.opendental.com/manual/security.html)
- Purpose (1–2 sentences): Control user access, group permissions and global security settings.
- Screen layout: Users and User Groups, filters, effective-permissions pane and global settings.
- Data fields: Show Only [All Users, Providers, Employees, Other], Group [All Groups/configured], Clinic [All Clinics/configured], Username [text], Show hidden users [checkbox], user/group bindings, employee/provider, clinic restrictions, credentials and global lock/logoff settings.
- Actions/buttons: Add, Copy or edit users, assign groups, configure grant/date restrictions, open Global Security Settings; CEMT when enabled.
- Business rules & logic: Effective permissions are read-only on Users tab. Group settings control grants. Copy brings group, clinic restrictions and alert subscriptions. Login, logout and exit generate audit entries.
- Statuses/workflow: Visible/hidden user, granted/denied or date-restricted permission.
- Links to other modules: Every protected screen, audit trail, clinics and Time Clock.
- Permissions: Security Admin.
- Reports/lists it appears in: Users and groups, permission catalog and Audit Trail.


### Setup > Definitions
- URL: [Open Dental manual](https://www.opendental.com/manual/definitions.html)
- Purpose (1–2 sentences): Configure practice-wide labels, statuses, colors and lookup items.
- Screen layout: Definition categories and ordered item grid, category-specific editor.
- Data fields: Name and abbreviation [text], hidden, color, value and feature-specific flags where category supports them.
- Actions/buttons: Choose category, Add/Edit, reorder, hide when allowed and Save.
- Business rules & logic: Definition category defines which fields and edits are permitted. Ordering can set defaults, including first appointment confirmation status. Disabling/hiding values affects future selection according to category.
- Statuses/workflow: Visible/hidden and ordered definitions.
- Links to other modules: Appointments, Chart, Account, Imaging, insurance, communication and reports.
- Permissions: Setup and any category-specific rights.
- Reports/lists it appears in: Definitions list and all dependent pickers/views.


### Setup > Automation
- URL: [Open Dental manual](https://www.opendental.com/manual/automation.html)
- Purpose (1–2 sentences): Run configured actions when supported practice events occur.
- Screen layout: Rules list and rule editor with trigger/action and optional conditions.
- Data fields: Description [text]. Trigger [ProcedureComplete, BreakAppointment, CreateApptNewPat, PatientOpen, CreateAppt, ScheduleProcedure, SetBillingType, RxCreate, Create Claim, OpenClaim, ApptComplete]. Action [PrintPatientLetter, CreateCommlog, PrintReferralLetter, ShowExamSheet, PopUp, SetApptStatusASAP, ShowConsentForm, SetApptType, PopUpThenDisable10Minutes, PatRestrictApptSchedTrue, PatRestrictApptSchedFalse, PrintRxInstuction, Change Pat Status]. Procedure codes [selector/CSV text], Condition Field/Comparison/Text, Sheet Def, Comm Type, Message and Patient Status where appropriate.
- Actions/buttons: Add/Edit, configure trigger and action, save and remove rules as supported.
- Business rules & logic: All attached conditions must match. Use separate rules for independent conditions. Needs Sheet uses exact template name and suppresses the action if filled today. Procedure triggers accept comma-separated codes without spaces. CreateApptNewPat skips Planned Appointments. ApptComplete requires a transition from a noncomplete status. Appointment restriction automation depends on Patient Restriction Edit.
- Statuses/workflow: Rule saved → trigger matches → action runs.
- Links to other modules: Chart procedures, appointments, communications, tasks and scheduled processing.
- Permissions: Setup.
- Reports/lists it appears in: Automation rule list and downstream action targets.


### Main Menu > Lists
- URL: [Open Dental manual](https://www.opendental.com/manual/mainmenu.html#lists)
- Purpose (1–2 sentences): Open maintained reference records and patient-related master lists.
- Screen layout: Drop-down menu; destination-specific master grid and edit dialog.
- Data fields: Destinations include Procedure Codes, Allergies, Clinics, Contacts, Counties, Dental School Classes/Courses, Discount Plans, Employees, Employers, Insurance Carriers/Plans, Lab Cases, Medications, Pharmacies, Prescriptions, Problems, Providers, Referrals, Sites, State Abbreviations, Zip Codes.
- Actions/buttons: Open destination; search/filter, add/edit or hide records where that list supports it.
- Business rules & logic: Used lists supply options across modules; shared records can affect all records referencing them. Some entries are feature-dependent.
- Statuses/workflow: Typically visible/hidden or active/inactive where the destination supports it.
- Links to other modules: Family, Account, Chart, Appointments, Imaging and Manage.
- Permissions: Destination-specific rights such as Carrier Edit/Create, Insurance Plan Edit and Setup for configuration.
- Reports/lists it appears in: Lists menu and master data reports.


### Main Menu > Reports
- URL: [Open Dental manual](https://opendental.com/manual/reports.html)
- Purpose (1–2 sentences): Run operational, accounting and clinical reports and approved queries.
- Screen layout: Standard and Favorites; Graphic, User Query and Query Favorites; Activity Log and Unfinalized Payments.
- Data fields: Report category [Production and Income, Daily, Monthly, Lists, Public Health]; dates and provider/clinic filters per report; saved query, output and configuration options.
- Actions/buttons: Run standard choices (Today, Yesterday, This Month, Last Month, This Year, More Options), open graphic charts, run saved/custom queries, configure report display/access, print/export and view unfinalized counts.
- Business rules & logic: Yesterday production on Monday uses Friday. Locked reports follow group settings. Unfinalized count requires Open Dental Service. Custom .rdl files can expose additional entries.
- Statuses/workflow: Available, favorite or Locked; report generation and output as selected.
- Links to other modules: All operational modules, reporting server, user query and eService log.
- Permissions: Report Setup security by group; separate User Query and export rights as applicable.
- Reports/lists it appears in: Standard Reports lists all report titles, including Daily Payments/Procedures, A/R Aging, Outstanding Claims, Discount Plans, Referrals, Prescription and Web Sched reports.


### Main Menu > Tools
- URL: [Open Dental manual](https://www.opendental.com/manual/mainmenu.html#tools)
- Purpose (1–2 sentences): Open operations, diagnostics, record-maintenance, and utility workflows.
- Screen layout: Tools menu with Misc Tools and Advertising submenus, feature-dependent entries.
- Data fields: Destination actions include capture/print screen, Aging, Audit Trail, finance/late/recurring charges, certifications, Database Maintenance, evaluations, Kiosk, Mobile Sync, Ortho Auto Claims, Patient Dashboard, eRouting, online payments, public-health screenings, setup wizard, Web Forms, Wiki and Zoom.
- Actions/buttons: Open tools; Misc Tools includes close plans, clear duplicate blockouts, create A to Z, patient DB maintenance, merge billing types/discount plans/images/meds/patients/providers/referrals, move subscribers, set patient status, manage service, shut down workstations, telephone list and latency test. Advertising opens Postcards.
- Business rules & logic: Availability depends on enabled features. Bulk tools act on their selected scope; audit and maintenance actions follow their own rules.
- Statuses/workflow: Tool-specific run, preview, reconciliation, merge or completion states.
- Links to other modules: Account, Appointments, Family, infrastructure, marketing and eServices.
- Permissions: Most require Setup; designated utilities such as Audit Trail have specific permissions.
- Reports/lists it appears in: Tools menu and downstream audit, maintenance, payments and billing outputs.


### Main Menu > eServices
- URL: [Open Dental manual](https://www.opendental.com/manual/eservicessetup.html)
- Purpose (1–2 sentences): Configure connected patient and practice services.
- Screen layout: eServices Setup with feature-specific setup and enrollment panels.
- Data fields: Account/clinic, enabled services, schedules and templates [service-dependent]; examples include Web Sched, Integrated Texting, Automated Messaging, eClipboard and Patient Portal.
- Actions/buttons: Open Setup, enroll/configure applicable service, select clinic and edit service settings/templates; view activity and histories from related screens.
- Business rules & logic: Entitlements and eConnector configuration determine availability. Service rules determine message timing, handling replies, booking and audit output.
- Statuses/workflow: Available, enrolled/configured, active; delivery and scheduling are tracked per service.
- Links to other modules: Appointments, Account, Family, Imaging, Portal and Reports.
- Permissions: EServicesSetup controls editing in most eServices windows. Individual services also have enrollment and action-specific requirements.
- Reports/lists it appears in: eService Activity Log, Web Sched Appointments, communication histories and service queues.

## Additional Main Menu sub-pages

These entries identify the linked desktop manual pages and summarize the documented controls. Where a page describes an operation without labeling a control, its dialog or screenshot is the source for further detail.

### Setup > Appointment Field Defs
- URL: [Open Dental manual](https://www.opendental.com/manual/appointmentfields.html)
- Purpose (1–2 sentences): Define additional visit-level inputs.
- Screen layout: Edit Appointment Field Def, Field Display, Using Appt Fields.
- Data fields: Field Name [entry], Field Type [entry], Text [entry], PickList [selector], Delete [entry].
- Actions/buttons: Setup, Add, Up / Down.
- Business rules & logic: The saved settings are consumed by the corresponding feature.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: The corresponding module or integrated feature.
- Permissions: Setup commonly governs this menu. Consult the feature's permission documentation for specific overrides.
- Reports/lists it appears in: Appointment Field Defs destination or its related record lists.

### Setup > Appointment Rules
- URL: [Open Dental manual](https://www.opendental.com/manual/appointmentrules.html)
- Purpose (1–2 sentences): Configure warnings based on appointment procedure combinations and intervals.
- Screen layout: Logic, WebSched Double Booking.
- Data fields: Description [entry], Code Start/End [entry], Is Enabled [checkbox].
- Actions/buttons: Delete.
- Business rules & logic: The saved settings are consumed by the corresponding feature.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: The corresponding module or integrated feature.
- Permissions: Setup commonly governs this menu. Consult the feature's permission documentation for specific overrides.
- Reports/lists it appears in: Appointment Rules destination or its related record lists.

### Setup > Appointment Views
- URL: [Open Dental manual](https://www.opendental.com/manual/appointmentviews.html)
- Purpose (1–2 sentences): Define visible operatories, provider bars and appointment box fields for schedule views.
- Screen layout: Destination-specific screen or procedure on the linked page.
- Data fields: Control names and types are not fully enumerated in the retrieved manual text.
- Actions/buttons: Define visible operatories, provider bars and appointment box fields for schedule views.
- Business rules & logic: The saved settings are consumed by the corresponding feature.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: The corresponding module or integrated feature.
- Permissions: Setup commonly governs this menu. Consult the feature's permission documentation for specific overrides.
- Reports/lists it appears in: Appointment Views destination or its related record lists.

### Setup > ASAP Message Setup
- URL: [Open Dental manual](https://www.opendental.com/manual/asapmsgs.html)
- Purpose (1–2 sentences): Customize manual and automated messages used to offer earlier openings.
- Screen layout: Message Edit.
- Data fields: Clinic-specific message [checkbox].
- Actions/buttons: Customize manual and automated messages used to offer earlier openings.
- Business rules & logic: The saved settings are consumed by the corresponding feature.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: The corresponding module or integrated feature.
- Permissions: Setup commonly governs this menu. Consult the feature's permission documentation for specific overrides.
- Reports/lists it appears in: ASAP Message Setup destination or its related record lists.

### Setup > Confirmation Setup
- URL: [Open Dental manual](https://www.opendental.com/manual/confirmationsetup.html)
- Purpose (1–2 sentences): Set default manual appointment confirmation messages and related behavior.
- Screen layout: Message Edit.
- Data fields: Control names and types are not fully enumerated in the retrieved manual text.
- Actions/buttons: Set default manual appointment confirmation messages and related behavior.
- Business rules & logic: The saved settings are consumed by the corresponding feature.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: The corresponding module or integrated feature.
- Permissions: Setup commonly governs this menu. Consult the feature's permission documentation for specific overrides.
- Reports/lists it appears in: Confirmation Setup destination or its related record lists.

### Setup > Insurance Verification Setup
- URL: [Open Dental manual](https://www.opendental.com/manual/insverifylistsetup.html)
- Purpose (1–2 sentences): Configure verification windows, Medicaid classification and service-year reverification criteria.
- Screen layout: Destination-specific screen or procedure on the linked page.
- Data fields: Unchecked [checkbox].
- Actions/buttons: Configure verification windows, Medicaid classification and service-year reverification criteria.
- Business rules & logic: The saved settings are consumed by the corresponding feature.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: The corresponding module or integrated feature.
- Permissions: Setup commonly governs this menu. Consult the feature's permission documentation for specific overrides.
- Reports/lists it appears in: Insurance Verification Setup destination or its related record lists.

### Setup > Operatories
- URL: [Open Dental manual](https://www.opendental.com/manual/operatories.html)
- Purpose (1–2 sentences): Maintain room configuration and default provider, hygiene and online scheduling settings.
- Screen layout: Combine Operatories, Prompts to Change Provider, Provider Logic.
- Data fields: Control names and types are not fully enumerated in the retrieved manual text.
- Actions/buttons: Clinic, Add, Combine, Up / Down.
- Business rules & logic: The saved settings are consumed by the corresponding feature.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: The corresponding module or integrated feature.
- Permissions: Setup commonly governs this menu. Consult the feature's permission documentation for specific overrides.
- Reports/lists it appears in: Operatories destination or its related record lists.

### Setup > Setup Reactivation
- URL: [Open Dental manual](https://www.opendental.com/manual/reactivationsetup.html)
- Purpose (1–2 sentences): Define how inactive patient recall/reactivation candidates are selected.
- Screen layout: Reactivation Messages, Reactivation Status Options, Reactivation List Default View, Contact Rules.
- Data fields: Control names and types are not fully enumerated in the retrieved manual text.
- Actions/buttons: Define how inactive patient recall/reactivation candidates are selected.
- Business rules & logic: The saved settings are consumed by the corresponding feature.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: The corresponding module or integrated feature.
- Permissions: Setup commonly governs this menu. Consult the feature's permission documentation for specific overrides.
- Reports/lists it appears in: Setup Reactivation destination or its related record lists.

### Setup > Recall Types
- URL: [Open Dental manual](https://www.opendental.com/manual/recalltypes.html)
- Purpose (1–2 sentences): Define recall clocks, triggering procedures and appointment procedure groups.
- Screen layout: Add / Edit Recall Types.
- Data fields: Description [entry], Prophy and Perio [entry], Age Limit [entry].
- Actions/buttons: Procedures that trigger this recall type, Procedures on Appointment, Restrict to Specific Blockouts.
- Business rules & logic: The saved settings are consumed by the corresponding feature.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: The corresponding module or integrated feature.
- Permissions: Setup commonly governs this menu. Consult the feature's permission documentation for specific overrides.
- Reports/lists it appears in: Recall Types destination or its related record lists.

### Setup > Claim Forms
- URL: [Open Dental manual](https://www.opendental.com/manual/claimforms.html)
- Purpose (1–2 sentences): Maintain paper claim layouts.
- Screen layout: Claim Forms, Reassign Claim Forms, Custom Claim Form Options.
- Data fields: Control names and types are not fully enumerated in the retrieved manual text.
- Actions/buttons: Copy, Add, Delete, Duplicate, Export.
- Business rules & logic: The saved settings are consumed by the corresponding feature.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: The corresponding module or integrated feature.
- Permissions: Setup commonly governs this menu. Consult the feature's permission documentation for specific overrides.
- Reports/lists it appears in: Claim Forms destination or its related record lists.

### Setup > Clearinghouses
- URL: [Open Dental manual](https://www.opendental.com/manual/clearinghouses.html)
- Purpose (1–2 sentences): Configure electronic claim routing and clearinghouse connections.
- Screen layout: Set Default, Automatic Report Settings, Individual Clearinghouses, Direct Connections to Payers, Troubleshooting.
- Data fields: Receive at an Interval [checkbox], Receive at a set time [checkbox].
- Actions/buttons: Dental, Medical, Eligibility.
- Business rules & logic: The saved settings are consumed by the corresponding feature.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: The corresponding module or integrated feature.
- Permissions: Setup commonly governs this menu. Consult the feature's permission documentation for specific overrides.
- Reports/lists it appears in: Clearinghouses destination or its related record lists.

### Setup > Insurance Blue Book Setup
- URL: [Open Dental manual](https://www.opendental.com/manual/bluebooksetup.html)
- Purpose (1–2 sentences): Set up historical allowed fee estimation for out-of-network coverage.
- Screen layout: Insurance Blue Book Rules Hierarchy, Hierarchy Logic, Allowed Fee Logic, Blue Book vs Legacy Blue Book.
- Data fields: Median [time], Average [time], Most Recent [numeric], Allow anonymous fee sharing [checkbox].
- Actions/buttons: Set up historical allowed fee estimation for out-of-network coverage.
- Business rules & logic: The saved settings are consumed by the corresponding feature.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: The corresponding module or integrated feature.
- Permissions: Setup commonly governs this menu. Consult the feature's permission documentation for specific overrides.
- Reports/lists it appears in: Insurance Blue Book Setup destination or its related record lists.

### Setup > Insurance Categories
- URL: [Open Dental manual](https://www.opendental.com/manual/inscatssetup.html)
- Purpose (1–2 sentences): Manage code categories that feed benefit calculations.
- Screen layout: Edit Insurance Categories, Edit Ins Coverage Spans, Electronic Benefit Categories, Additional Information.
- Data fields: From Code [entry], To Code [entry].
- Actions/buttons: Up/Down, Add, Add Span.
- Business rules & logic: The saved settings are consumed by the corresponding feature.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: The corresponding module or integrated feature.
- Permissions: Setup commonly governs this menu. Consult the feature's permission documentation for specific overrides.
- Reports/lists it appears in: Insurance Categories destination or its related record lists.

### Setup > Insurance Filing Codes
- URL: [Open Dental manual](https://www.opendental.com/manual/insfilingcodes.html)
- Purpose (1–2 sentences): Manage claim filing categories for insurance plans.
- Screen layout: Edit Claim Filing Code.
- Data fields: Group [selector].
- Actions/buttons: Insurance Filing Code Subtypes.
- Business rules & logic: The saved settings are consumed by the corresponding feature.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: The corresponding module or integrated feature.
- Permissions: Setup commonly governs this menu. Consult the feature's permission documentation for specific overrides.
- Reports/lists it appears in: Insurance Filing Codes destination or its related record lists.

### Setup > Patient Fields
- URL: [Open Dental manual](https://www.opendental.com/manual/custompatientfields.html)
- Purpose (1–2 sentences): Create additional fields shown on patient records.
- Screen layout: Edit Patient Field Def, Field Display, Using Patient Fields.
- Data fields: Field Name [entry], Field Type [entry], Text [entry], PickList [selector], Date [entry], Checkbox [checkbox], Add [selector], Name [selector], Abbreviation [entry], Merge [selector], Hidden [checkbox].
- Actions/buttons: Field Location.
- Business rules & logic: The saved settings are consumed by the corresponding feature.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: The corresponding module or integrated feature.
- Permissions: Setup commonly governs this menu. Consult the feature's permission documentation for specific overrides.
- Reports/lists it appears in: Patient Fields destination or its related record lists.

### Setup > Electronic Payer IDs
- URL: [Open Dental manual](https://www.opendental.com/manual/payerids.html)
- Purpose (1–2 sentences): Maintain electronic payer identifiers used for routing.
- Screen layout: Add or Edit an ID, Automatically Update Payer IDs.
- Data fields: Payer ID [entry], Carrier Name [entry], Comments [entry], Is Medicaid [checkbox].
- Actions/buttons: Maintain electronic payer identifiers used for routing.
- Business rules & logic: The saved settings are consumed by the corresponding feature.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: The corresponding module or integrated feature.
- Permissions: Setup commonly governs this menu. Consult the feature's permission documentation for specific overrides.
- Reports/lists it appears in: Electronic Payer IDs destination or its related record lists.

### Setup > Allocations Setup
- URL: [Open Dental manual](https://www.opendental.com/manual/allocationssetup.html)
- Purpose (1–2 sentences): Set allocation behavior for patient payments, income transfers and insurance totals.
- Screen layout: Quick Allocation Settings, Paysplits, Adjustments, Treatment Planned Prepayments.
- Data fields: Control names and types are not fully enumerated in the retrieved manual text.
- Actions/buttons: Set allocation behavior for patient payments, income transfers and insurance totals.
- Business rules & logic: The saved settings are consumed by the corresponding feature.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: The corresponding module or integrated feature.
- Permissions: Setup commonly governs this menu. Consult the feature's permission documentation for specific overrides.
- Reports/lists it appears in: Allocations Setup destination or its related record lists.

### Setup > Payment Plan Templates
- URL: [Open Dental manual](https://www.opendental.com/manual/payplantemplates.html)
- Purpose (1–2 sentences): Configure reusable default repayment terms.
- Screen layout: Destination-specific screen or procedure on the linked page.
- Data fields: Control names and types are not fully enumerated in the retrieved manual text.
- Actions/buttons: Configure reusable default repayment terms.
- Business rules & logic: The saved settings are consumed by the corresponding feature.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: The corresponding module or integrated feature.
- Permissions: Setup commonly governs this menu. Consult the feature's permission documentation for specific overrides.
- Reports/lists it appears in: Payment Plan Templates destination or its related record lists.

### Setup > EHR Setup Window
- URL: [Open Dental manual](https://www.opendental.com/manual/ehrsetupwindow.html)
- Purpose (1–2 sentences): Configure enabled electronic health record options.
- Screen layout: Destination-specific screen or procedure on the linked page.
- Data fields: Provider Keys [entry].
- Actions/buttons: Configure enabled electronic health record options.
- Business rules & logic: The saved settings are consumed by the corresponding feature.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: The corresponding module or integrated feature.
- Permissions: Setup commonly governs this menu. Consult the feature's permission documentation for specific overrides.
- Reports/lists it appears in: EHR Setup Window destination or its related record lists.

### Setup > Procedure Buttons
- URL: [Open Dental manual](https://www.opendental.com/manual/procedurebuttons.html)
- Purpose (1–2 sentences): Map clinical charting buttons to procedures and Auto Codes.
- Screen layout: Destination-specific screen or procedure on the linked page.
- Data fields: Control names and types are not fully enumerated in the retrieved manual text.
- Actions/buttons: Map clinical charting buttons to procedures and Auto Codes.
- Business rules & logic: The saved settings are consumed by the corresponding feature.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: The corresponding module or integrated feature.
- Permissions: Setup commonly governs this menu. Consult the feature's permission documentation for specific overrides.
- Reports/lists it appears in: Procedure Buttons destination or its related record lists.

### Setup > Imaging Devices
- URL: [Open Dental manual](https://www.opendental.com/manual/imagingdevices.html)
- Purpose (1–2 sentences): Configure supported capture devices and drivers.
- Screen layout: Troubleshooting.
- Data fields: Description [entry], Computer Name [entry], Device Type [entry], Twain Name [selector], Show Twain UI [checkbox].
- Actions/buttons: Add, Up / Down, This.
- Business rules & logic: The saved settings are consumed by the corresponding feature.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: The corresponding module or integrated feature.
- Permissions: Setup commonly governs this menu. Consult the feature's permission documentation for specific overrides.
- Reports/lists it appears in: Imaging Devices destination or its related record lists.

### Setup > Imaging Quality
- URL: [Open Dental manual](https://www.opendental.com/manual/imagingsetup.html)
- Purpose (1–2 sentences): Adjust scanner and image acquisition defaults.
- Screen layout: Documents, Radiographs, Photos.
- Data fields: Show Select Scanner Window [checkbox].
- Actions/buttons: Set Default Scanner.
- Business rules & logic: The saved settings are consumed by the corresponding feature.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: The corresponding module or integrated feature.
- Permissions: Setup commonly governs this menu. Consult the feature's permission documentation for specific overrides.
- Reports/lists it appears in: Imaging Quality destination or its related record lists.

### Setup > Mount Definitions
- URL: [Open Dental manual](https://www.opendental.com/manual/mountdefinitions.html)
- Purpose (1–2 sentences): Configure acquisition templates and image positions.
- Screen layout: Generate Mount, Edit Mount Def, Item Edit.
- Data fields: Type [selector], Columns/Rows [entry], Description [entry], Text BackG Transparent [checkbox], Flip on Acquire [checkbox], Use Adj Mode After Series [checkbox], Optional Units (mm) [entry], Scale, pixels per unit [entry], X/Y [entry], Width/Height [entry], Text to Show [entry], Add Field [entry].
- Actions/buttons: Add, Up/Down, Generate, Add Item, Reorder All.
- Business rules & logic: The saved settings are consumed by the corresponding feature.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: The corresponding module or integrated feature.
- Permissions: Setup commonly governs this menu. Consult the feature's permission documentation for specific overrides.
- Reports/lists it appears in: Mount Definitions destination or its related record lists.

### Setup > Email Setup
- URL: [Open Dental manual](https://www.opendental.com/manual/emailsetup.html)
- Purpose (1–2 sentences): Set up sender accounts and email transmission.
- Screen layout: Destination-specific screen or procedure on the linked page.
- Data fields: Inbox Receive Interval [checkbox].
- Actions/buttons: Set up sender accounts and email transmission.
- Business rules & logic: The saved settings are consumed by the corresponding feature.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: The corresponding module or integrated feature.
- Permissions: Setup commonly governs this menu. Consult the feature's permission documentation for specific overrides.
- Reports/lists it appears in: Email Setup destination or its related record lists.

### Setup > Messaging Buttons
- URL: [Open Dental manual](https://www.opendental.com/manual/messagingbuttons.html)
- Purpose (1–2 sentences): Define workstation messaging button appearance and behavior.
- Screen layout: Set up Messaging Buttons, Hints, Troubleshooting.
- Data fields: Sync Icon (optional) [entry].
- Actions/buttons: Define workstation messaging button appearance and behavior.
- Business rules & logic: The saved settings are consumed by the corresponding feature.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: The corresponding module or integrated feature.
- Permissions: Setup commonly governs this menu. Consult the feature's permission documentation for specific overrides.
- Reports/lists it appears in: Messaging Buttons destination or its related record lists.

### Setup > Time Card Setup
- URL: [Open Dental manual](https://www.opendental.com/manual/timecardsetup.html)
- Purpose (1–2 sentences): Set attendance and time-card defaults.
- Screen layout: Pay Periods, Rules.
- Data fields: Start Date [date], End Date [date], Paycheck Date [date], Semi-Monthly Settings [entry], Period 1 Day [entry], Period 2 Day [entry], Pay Date [checkbox], Pay Day [checkbox], Day of Week [selector], Exclude Weekends [checkbox], Overtime if over Hours Per Day [entry], Rate2 Hours [time], Before Time of Day [time], After Time of Day [time], Use Rate3 for Weekend Hours [checkbox], Is Overtime Exempt [checkbox], Earliest Clock in Time [time].
- Actions/buttons: Add One, Delete, Generate Many, Generate, Add.
- Business rules & logic: The saved settings are consumed by the corresponding feature.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: The corresponding module or integrated feature.
- Permissions: Setup commonly governs this menu. Consult the feature's permission documentation for specific overrides.
- Reports/lists it appears in: Time Card Setup destination or its related record lists.

### Setup > API Developer Setup
- URL: [Open Dental manual](https://www.opendental.com/site/apisetup.html)
- Purpose (1–2 sentences): Set up an integration developer account and keys.
- Screen layout: Steps to Enable the API, API Keys, Developer Portal, Authorization, Testing, Retrieving Aging Data.
- Data fields: Control names and types are not fully enumerated in the retrieved manual text.
- Actions/buttons: Set up an integration developer account and keys.
- Business rules & logic: The saved settings are consumed by the corresponding feature.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: The corresponding module or integrated feature.
- Permissions: Setup commonly governs this menu. Consult the feature's permission documentation for specific overrides.
- Reports/lists it appears in: API Developer Setup destination or its related record lists.

### Setup > Computers
- URL: [Open Dental manual](https://www.opendental.com/manual/computer.html)
- Purpose (1–2 sentences): Manage workstation records and associated settings.
- Screen layout: Destination-specific screen or procedure on the linked page.
- Data fields: Control names and types are not fully enumerated in the retrieved manual text.
- Actions/buttons: Manage workstation records and associated settings.
- Business rules & logic: The saved settings are consumed by the corresponding feature.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: The corresponding module or integrated feature.
- Permissions: Setup commonly governs this menu. Consult the feature's permission documentation for specific overrides.
- Reports/lists it appears in: Computers destination or its related record lists.

### Setup > API Setup
- URL: [Open Dental manual](https://www.opendental.com/manual/fhir.html)
- Purpose (1–2 sentences): Set up the interface used by authorized external applications.
- Screen layout: Customer Setup, FHIR.
- Data fields: Enabled [checkbox], Payment type for created payments [entry].
- Actions/buttons: Add Key.
- Business rules & logic: The saved settings are consumed by the corresponding feature.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: The corresponding module or integrated feature.
- Permissions: Setup commonly governs this menu. Consult the feature's permission documentation for specific overrides.
- Reports/lists it appears in: API Setup destination or its related record lists.

### Setup > HIE Setup
- URL: [Open Dental manual](https://www.opendental.com/manual/hiesetup.html)
- Purpose (1–2 sentences): Configure available health information exchange integration.
- Screen layout: HIE and CCD Logic.
- Data fields: Is Enabled [checkbox], Export CCD Time of Day [time].
- Actions/buttons: Export CCD Path.
- Business rules & logic: The saved settings are consumed by the corresponding feature.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: The corresponding module or integrated feature.
- Permissions: Setup commonly governs this menu. Consult the feature's permission documentation for specific overrides.
- Reports/lists it appears in: HIE Setup destination or its related record lists.

### Setup > Generic HL7
- URL: [Open Dental manual](https://www.opendental.com/manual/hl7.html)
- Purpose (1–2 sentences): Configure clinical interfaces that use HL7 messages.
- Screen layout: Setup Steps, Troubleshooting.
- Data fields: Control names and types are not fully enumerated in the retrieved manual text.
- Actions/buttons: Configure clinical interfaces that use HL7 messages.
- Business rules & logic: The saved settings are consumed by the corresponding feature.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: The corresponding module or integrated feature.
- Permissions: Setup commonly governs this menu. Consult the feature's permission documentation for specific overrides.
- Reports/lists it appears in: Generic HL7 destination or its related record lists.

### Setup > Replication
- URL: [Open Dental manual](https://www.opendental.com/manual/replication.html)
- Purpose (1–2 sentences): Configure database replication behavior.
- Screen layout: Warnings, Features that Won't Work with Replication, Replication Options, Database Maintenance.
- Data fields: Control names and types are not fully enumerated in the retrieved manual text.
- Actions/buttons: Configure database replication behavior.
- Business rules & logic: The saved settings are consumed by the corresponding feature.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: The corresponding module or integrated feature.
- Permissions: Setup commonly governs this menu. Consult the feature's permission documentation for specific overrides.
- Reports/lists it appears in: Replication destination or its related record lists.

### Setup > Show Features
- URL: [Open Dental manual](https://www.opendental.com/manual/showfeatures.html)
- Purpose (1–2 sentences): Toggle optional workflows and modules.
- Screen layout: Destination-specific screen or procedure on the linked page.
- Data fields: Enterprise Setup [checkbox].
- Actions/buttons: Toggle optional workflows and modules.
- Business rules & logic: The saved settings are consumed by the corresponding feature.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: The corresponding module or integrated feature.
- Permissions: Setup commonly governs this menu. Consult the feature's permission documentation for specific overrides.
- Reports/lists it appears in: Show Features destination or its related record lists.

### Setup > Scheduled Processes
- URL: [Open Dental manual](https://www.opendental.com/manual/scheduledprocesses.html)
- Purpose (1–2 sentences): Configure time-driven background jobs.
- Screen layout: Ins Batch Verify, Statements.
- Data fields: Scheduled Action [selector], Time to Run [time], Create Adjustments [checkbox], Check Deductible [checkbox], Check Annual Max [checkbox], Change Ins History [checkbox], Change Effective Dates [checkbox].
- Actions/buttons: Delete.
- Business rules & logic: The saved settings are consumed by the corresponding feature.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: The corresponding module or integrated feature.
- Permissions: Setup commonly governs this menu. Consult the feature's permission documentation for specific overrides.
- Reports/lists it appears in: Scheduled Processes destination or its related record lists.

### Setup > Preferences
- URL: [Open Dental manual](https://www.opendental.com/manual/preferences.html)
- Purpose (1–2 sentences): Manage practice and feature preferences.
- Screen layout: Categories.
- Data fields: Search [entry].
- Actions/buttons: Manage practice and feature preferences.
- Business rules & logic: The saved settings are consumed by the corresponding feature.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: The corresponding module or integrated feature.
- Permissions: Setup commonly governs this menu. Consult the feature's permission documentation for specific overrides.
- Reports/lists it appears in: Preferences destination or its related record lists.

### Setup > Alerts
- URL: [Open Dental manual](https://www.opendental.com/manual/alerts.html)
- Purpose (1–2 sentences): Set up alert subscriptions and display for supported categories.
- Screen layout: Alert Descriptions.
- Data fields: Control names and types are not fully enumerated in the retrieved manual text.
- Actions/buttons: Set up alert subscriptions and display for supported categories.
- Business rules & logic: The saved settings are consumed by the corresponding feature.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: The corresponding module or integrated feature.
- Permissions: Setup commonly governs this menu. Consult the feature's permission documentation for specific overrides.
- Reports/lists it appears in: Alerts destination or its related record lists.

### Setup > Auto Codes
- URL: [Open Dental manual](https://www.opendental.com/manual/autocode.html)
- Purpose (1–2 sentences): Map charting inputs to appropriate procedure codes.
- Screen layout: Edit Auto Code, Edit Auto Code Item.
- Data fields: Control names and types are not fully enumerated in the retrieved manual text.
- Actions/buttons: Code.
- Business rules & logic: The saved settings are consumed by the corresponding feature.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: The corresponding module or integrated feature.
- Permissions: Setup commonly governs this menu. Consult the feature's permission documentation for specific overrides.
- Reports/lists it appears in: Auto Codes destination or its related record lists.

### Setup > Auto Notes
- URL: [Open Dental manual](https://www.opendental.com/manual/autonotes.html)
- Purpose (1–2 sentences): Configure reusable clinical text with prompts.
- Screen layout: Editing Auto Note in Progress.
- Data fields: Control names and types are not fully enumerated in the retrieved manual text.
- Actions/buttons: Configure reusable clinical text with prompts.
- Business rules & logic: The saved settings are consumed by the corresponding feature.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: The corresponding module or integrated feature.
- Permissions: Setup commonly governs this menu. Consult the feature's permission documentation for specific overrides.
- Reports/lists it appears in: Auto Notes destination or its related record lists.

### Setup > Paths
- URL: [Open Dental manual](https://www.opendental.com/manual/paths.html)
- Purpose (1–2 sentences): Configure image and related file locations.
- Screen layout: A to Z Images Folder, Export Path, Letter Merge Path, Troubleshooting.
- Data fields: Control names and types are not fully enumerated in the retrieved manual text.
- Actions/buttons: Problem.
- Business rules & logic: The saved settings are consumed by the corresponding feature.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: The corresponding module or integrated feature.
- Permissions: Setup commonly governs this menu. Consult the feature's permission documentation for specific overrides.
- Reports/lists it appears in: Paths destination or its related record lists.

### Setup > Dental Schools
- URL: [Open Dental manual](https://www.opendental.com/manual/dentalschools.html)
- Purpose (1–2 sentences): Configure the dental school deployment options.
- Screen layout: Setup, Using Dental Schools.
- Data fields: Control names and types are not fully enumerated in the retrieved manual text.
- Actions/buttons: Configure the dental school deployment options.
- Business rules & logic: The saved settings are consumed by the corresponding feature.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: The corresponding module or integrated feature.
- Permissions: Setup commonly governs this menu. Consult the feature's permission documentation for specific overrides.
- Reports/lists it appears in: Dental Schools destination or its related record lists.

### Setup > Display Fields
- URL: [Open Dental manual](https://www.opendental.com/manual/displayfields.html)
- Purpose (1–2 sentences): Control fields, order and columns on eligible screens.
- Screen layout: Available Fields.
- Data fields: Control names and types are not fully enumerated in the retrieved manual text.
- Actions/buttons: Up / Down.
- Business rules & logic: The saved settings are consumed by the corresponding feature.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: The corresponding module or integrated feature.
- Permissions: Setup commonly governs this menu. Consult the feature's permission documentation for specific overrides.
- Reports/lists it appears in: Display Fields destination or its related record lists.

### Setup > Fee Schedule Groups
- URL: [Open Dental manual](https://www.opendental.com/manual/feeschedulegroups.html)
- Purpose (1–2 sentences): Group fee schedules for Enterprise selection.
- Screen layout: Fee Schedule Group Edit.
- Data fields: Fee Schedule [entry], Clinic [selector].
- Actions/buttons: Add Group.
- Business rules & logic: The saved settings are consumed by the corresponding feature.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: The corresponding module or integrated feature.
- Permissions: Fee Schedule Edit.
- Reports/lists it appears in: Fee Schedule Groups destination or its related record lists.

### Setup > Laboratories
- URL: [Open Dental manual](https://www.opendental.com/manual/laboratories.html)
- Purpose (1–2 sentences): Configure lab contacts, services, slips and turnaround durations.
- Screen layout: Destination-specific screen or procedure on the linked page.
- Data fields: Is Hidden [checkbox], Turnaround Times [entry].
- Actions/buttons: Configure lab contacts, services, slips and turnaround durations.
- Business rules & logic: The saved settings are consumed by the corresponding feature.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: The corresponding module or integrated feature.
- Permissions: Setup commonly governs this menu. Consult the feature's permission documentation for specific overrides.
- Reports/lists it appears in: Laboratories destination or its related record lists.

### Setup > Practice Setup
- URL: [Open Dental manual](https://www.opendental.com/manual/practice.html)
- Purpose (1–2 sentences): Set practice identity and practice defaults.
- Screen layout: General Practice Information, Practice and Billing Address, Banking Info, Billing Default Type, Default Provider, Default Proc Place Service, Default Insurance Billing Provider.
- Data fields: Practice is Medical [checkbox], Provider Name/Practice Title [entry], Phone [entry], Fax [entry], Physical Treating Address [entry], Billing Address [entry], Use on Claims [checkbox], Pay To Address [entry], Bank Deposit Acct Number and Info [entry], Default Practice Provider [checkbox], Treating Provider [checkbox], Specific Provider [checkbox].
- Actions/buttons: Set practice identity and practice defaults.
- Business rules & logic: The saved settings are consumed by the corresponding feature.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: The corresponding module or integrated feature.
- Permissions: Setup commonly governs this menu. Consult the feature's permission documentation for specific overrides.
- Reports/lists it appears in: Practice Setup destination or its related record lists.

### Setup > Program Links
- URL: [Open Dental manual](https://www.opendental.com/manual/programlinks.html)
- Purpose (1–2 sentences): Enable and configure integrations with outside applications.
- Screen layout: Program Link Settings, Button Settings, Remote Desktop Solutions, Troubleshooting.
- Data fields: Enabled [checkbox], Order Alphabetical [checkbox], ReportsMenu [selector].
- Actions/buttons: Enable and configure integrations with outside applications.
- Business rules & logic: The saved settings are consumed by the corresponding feature.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: The corresponding module or integrated feature.
- Permissions: Setup commonly governs this menu. Consult the feature's permission documentation for specific overrides.
- Reports/lists it appears in: Program Links destination or its related record lists.

### Setup > Quick Paste Notes Setup
- URL: [Open Dental manual](https://www.opendental.com/manual/quickpastenotessetup.html)
- Purpose (1–2 sentences): Maintain reusable note text and shortcuts.
- Screen layout: Category, Note, Using Quick Paste Notes.
- Data fields: Control names and types are not fully enumerated in the retrieved manual text.
- Actions/buttons: Maintain reusable note text and shortcuts.
- Business rules & logic: The saved settings are consumed by the corresponding feature.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: The corresponding module or integrated feature.
- Permissions: Setup commonly governs this menu. Consult the feature's permission documentation for specific overrides.
- Reports/lists it appears in: Quick Paste Notes Setup destination or its related record lists.

### Setup > Required Fields
- URL: [Open Dental manual](https://www.opendental.com/manual/requiredfields.html)
- Purpose (1–2 sentences): Specify fields that are mandatory in supported entry workflows.
- Screen layout: Mark Fields as Required, Validation of Medicaid ID and State.
- Data fields: Right Arrow [selector].
- Actions/buttons: Add, Delete.
- Business rules & logic: The saved settings are consumed by the corresponding feature.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: The corresponding module or integrated feature.
- Permissions: Setup commonly governs this menu. Consult the feature's permission documentation for specific overrides.
- Reports/lists it appears in: Required Fields destination or its related record lists.

### Setup > Dental School Requirements Needed
- URL: [Open Dental manual](https://www.opendental.com/manual/requirements.html)
- Purpose (1–2 sentences): Track requirements needed in the dental school workflow.
- Screen layout: Add Requirements, Copy Requirements, Attach Requirements to an Appointment, Students: Viewing and Editing Requirements, Instructors: Viewing Requirements.
- Data fields: Control names and types are not fully enumerated in the retrieved manual text.
- Actions/buttons: Track requirements needed in the dental school workflow.
- Business rules & logic: The saved settings are consumed by the corresponding feature.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: The corresponding module or integrated feature.
- Permissions: Setup commonly governs this menu. Consult the feature's permission documentation for specific overrides.
- Reports/lists it appears in: Dental School Requirements Needed destination or its related record lists.

### Setup > User Edit
- URL: [Open Dental manual](https://www.opendental.com/manual/securityusers.html)
- Purpose (1–2 sentences): Configure individual users and associations.
- Screen layout: User Tab, Clinics Tab, Alert Subs Tab, Password Options and Save.
- Data fields: Name [entry], Badge ID [entry], Require Password Reset [checkbox], Is Hidden [checkbox], New Password [entry], Show [checkbox].
- Actions/buttons: Unlock Account.
- Business rules & logic: The saved settings are consumed by the corresponding feature.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: The corresponding module or integrated feature.
- Permissions: Security Admin.
- Reports/lists it appears in: User Edit destination or its related record lists.

### Setup > Security Badges
- URL: [Open Dental manual](https://www.opendental.com/manual/securitybadges.html)
- Purpose (1–2 sentences): Configure security badges for supported authentication workflows.
- Screen layout: Logging On With a Badge.
- Data fields: Control names and types are not fully enumerated in the retrieved manual text.
- Actions/buttons: Configure security badges for supported authentication workflows.
- Business rules & logic: The saved settings are consumed by the corresponding feature.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: The corresponding module or integrated feature.
- Permissions: Setup commonly governs this menu. Consult the feature's permission documentation for specific overrides.
- Reports/lists it appears in: Security Badges destination or its related record lists.

### Setup > Sheets
- URL: [Open Dental manual](https://www.opendental.com/manual/sheets.html)
- Purpose (1–2 sentences): Create templates for forms, letters and other outputs.
- Screen layout: Sheet Design Service.
- Data fields: Sheet Type Filter [selector], Copy [selector].
- Actions/buttons: Defaults, Tools.
- Business rules & logic: The saved settings are consumed by the corresponding feature.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: The corresponding module or integrated feature.
- Permissions: Setup commonly governs this menu. Consult the feature's permission documentation for specific overrides.
- Reports/lists it appears in: Sheets destination or its related record lists.

### Setup > Spell Check
- URL: [Open Dental manual](https://www.opendental.com/manual/spellcheck.html)
- Purpose (1–2 sentences): Configure spell checking and eligible text behavior.
- Screen layout: Using Spell Check, Technical Details.
- Data fields: Spell Check Enabled [checkbox], Add [entry], Disable Spell Check [checkbox].
- Actions/buttons: Delete.
- Business rules & logic: The saved settings are consumed by the corresponding feature.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: The corresponding module or integrated feature.
- Permissions: Setup commonly governs this menu. Consult the feature's permission documentation for specific overrides.
- Reports/lists it appears in: Spell Check destination or its related record lists.

### Setup > Web Form Setup
- URL: [Open Dental manual](https://www.opendental.com/manual/webformsupload.html)
- Purpose (1–2 sentences): Select and configure templates for online forms.
- Screen layout: Available Web Forms, Preferences, Construct URL, Details.
- Data fields: Search [entry], Checked [entry].
- Actions/buttons: Add, Delete, Clinic, Navigate to URL(s).
- Business rules & logic: The saved settings are consumed by the corresponding feature.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: The corresponding module or integrated feature.
- Permissions: Setup commonly governs this menu. Consult the feature's permission documentation for specific overrides.
- Reports/lists it appears in: Web Form Setup destination or its related record lists.

### Lists > Procedure Codes
- URL: [Open Dental manual](https://www.opendental.com/manual/procedurecodes.html)
- Purpose (1–2 sentences): Maintain procedure codes, treatment areas and associated fees.
- Screen layout: Search, Procedure Codes, Procedures, Compare Fee Schedules, Enter Fees via the Procedure Code List.
- Data fields: Show Hidden [checkbox], Show Fee Schedule Groups [entry], Clinic [entry], Provider [entry].
- Actions/buttons: Fee Schedule.
- Business rules & logic: The records are maintained as practice reference data.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: Shared pickers and records in the modules that use this reference data.
- Permissions: Destination-specific permission applies where documented.
- Reports/lists it appears in: Procedure Codes destination or its related record lists.

### Lists > Allergy List
- URL: [Open Dental manual](https://www.opendental.com/manual/allergiesmaster.html)
- Purpose (1–2 sentences): Maintain the allergy master dictionary.
- Screen layout: Allergy Def Edit.
- Data fields: Show Hidden [checkbox], Description [entry], Is Hidden [checkbox].
- Actions/buttons: Medication.
- Business rules & logic: The records are maintained as practice reference data.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: Shared pickers and records in the modules that use this reference data.
- Permissions: Destination-specific permission applies where documented.
- Reports/lists it appears in: Allergy List destination or its related record lists.

### Lists > Clinics
- URL: [Open Dental manual](https://www.opendental.com/manual/clinics.html)
- Purpose (1–2 sentences): Maintain clinic identities, providers and related setup.
- Screen layout: Clinic Setup, Logic, Troubleshooting.
- Data fields: Control names and types are not fully enumerated in the retrieved manual text.
- Actions/buttons: Maintain clinic identities, providers and related setup.
- Business rules & logic: The records are maintained as practice reference data.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: Shared pickers and records in the modules that use this reference data.
- Permissions: Destination-specific permission applies where documented.
- Reports/lists it appears in: Clinics destination or its related record lists.

### Lists > Contacts
- URL: [Open Dental manual](https://www.opendental.com/manual/contacts.html)
- Purpose (1–2 sentences): Maintain office contacts.
- Screen layout: Destination-specific screen or procedure on the linked page.
- Data fields: Control names and types are not fully enumerated in the retrieved manual text.
- Actions/buttons: Maintain office contacts.
- Business rules & logic: The records are maintained as practice reference data.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: Shared pickers and records in the modules that use this reference data.
- Permissions: Destination-specific permission applies where documented.
- Reports/lists it appears in: Contacts destination or its related record lists.

### Lists > Counties
- URL: [Open Dental manual](https://www.opendental.com/manual/counties.html)
- Purpose (1–2 sentences): Maintain county lookup records for applicable public-health workflows.
- Screen layout: Destination-specific screen or procedure on the linked page.
- Data fields: County Name [selector], County Code [entry].
- Actions/buttons: Add, Remove.
- Business rules & logic: The records are maintained as practice reference data.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: Shared pickers and records in the modules that use this reference data.
- Permissions: Destination-specific permission applies where documented.
- Reports/lists it appears in: Counties destination or its related record lists.

### Lists > Dental School Classes
- URL: [Open Dental manual](https://www.opendental.com/manual/dsclasses.html)
- Purpose (1–2 sentences): Maintain dental student class records.
- Screen layout: Destination-specific screen or procedure on the linked page.
- Data fields: Graduation Year [entry], Description [entry].
- Actions/buttons: Delete.
- Business rules & logic: The records are maintained as practice reference data.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: Shared pickers and records in the modules that use this reference data.
- Permissions: Destination-specific permission applies where documented.
- Reports/lists it appears in: Dental School Classes destination or its related record lists.

### Lists > Dental School Courses
- URL: [Open Dental manual](https://www.opendental.com/manual/dscourses.html)
- Purpose (1–2 sentences): Maintain dental school course records.
- Screen layout: Destination-specific screen or procedure on the linked page.
- Data fields: Course ID [entry], Description [entry].
- Actions/buttons: Maintain dental school course records.
- Business rules & logic: The records are maintained as practice reference data.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: Shared pickers and records in the modules that use this reference data.
- Permissions: Destination-specific permission applies where documented.
- Reports/lists it appears in: Dental School Courses destination or its related record lists.

### Lists > Employees
- URL: [Open Dental manual](https://www.opendental.com/manual/employees.html)
- Purpose (1–2 sentences): Maintain staff records for scheduling and time clock.
- Screen layout: Employee Edit.
- Data fields: Hidden [checkbox], First Name / Last Name / MI [entry], Phone Ext [entry], Wireless Phone [entry], Email Work [entry], Email Personal [entry], Furloughed [checkbox].
- Actions/buttons: Maintain staff records for scheduling and time clock.
- Business rules & logic: The records are maintained as practice reference data.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: Shared pickers and records in the modules that use this reference data.
- Permissions: Destination-specific permission applies where documented.
- Reports/lists it appears in: Employees destination or its related record lists.

### Lists > Employers
- URL: [Open Dental manual](https://www.opendental.com/manual/employers.html)
- Purpose (1–2 sentences): Maintain employer records used by insurance plans.
- Screen layout: Edit Employer, Combine Employers.
- Data fields: Control names and types are not fully enumerated in the retrieved manual text.
- Actions/buttons: Maintain employer records used by insurance plans.
- Business rules & logic: The records are maintained as practice reference data.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: Shared pickers and records in the modules that use this reference data.
- Permissions: Destination-specific permission applies where documented.
- Reports/lists it appears in: Employers destination or its related record lists.

### Lists > Carriers
- URL: [Open Dental manual](https://www.opendental.com/manual/carriers.html)
- Purpose (1–2 sentences): Maintain insurer contact and electronic routing details.
- Screen layout: Edit Carrier.
- Data fields: Show Hidden [checkbox], CDAnet Only [checkbox], Is trusted for real-time eligibility [checkbox], Ins Plan Subscribers [selector].
- Actions/buttons: Maintain insurer contact and electronic routing details.
- Business rules & logic: The records are maintained as practice reference data.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: Shared pickers and records in the modules that use this reference data.
- Permissions: Destination-specific permission applies where documented.
- Reports/lists it appears in: Carriers destination or its related record lists.

### Lists > Insurance Plans
- URL: [Open Dental manual](https://www.opendental.com/manual/insplanlist.html)
- Purpose (1–2 sentences): Find and maintain shared plan records.
- Screen layout: Filters, Insurance Plans, Questions and Answers.
- Data fields: Employer [entry], Group Num [entry], Carrier [entry], Group Name [entry], Ins Plan ID [entry], Order By [selector].
- Actions/buttons: Get All, Blank Plan.
- Business rules & logic: The records are maintained as practice reference data.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: Shared pickers and records in the modules that use this reference data.
- Permissions: Destination-specific permission applies where documented.
- Reports/lists it appears in: Insurance Plans destination or its related record lists.

### Lists > Lab Cases
- URL: [Open Dental manual](https://www.opendental.com/manual/labcasemanage.html)
- Purpose (1–2 sentences): Find completed, outstanding or unattached laboratory work according to filters.
- Screen layout: Filters, Lab Case Grid.
- Data fields: From/To Date [date], Show Unattached [checkbox], Show Completed [checkbox], Lab Phone [entry], Instructions [entry].
- Actions/buttons: Find completed, outstanding or unattached laboratory work according to filters.
- Business rules & logic: The records are maintained as practice reference data.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: Shared pickers and records in the modules that use this reference data.
- Permissions: Destination-specific permission applies where documented.
- Reports/lists it appears in: Lab Cases destination or its related record lists.

### Lists > Medications List
- URL: [Open Dental manual](https://www.opendental.com/manual/medicationmaster.html)
- Purpose (1–2 sentences): Maintain medication reference entries.
- Screen layout: All Medications Tab, Edit a Medication, Missing Generic/Brand Tab.
- Data fields: Drug Name [entry], Generic Name [entry].
- Actions/buttons: RxNorm, Dependencies, Brands.
- Business rules & logic: The records are maintained as practice reference data.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: Shared pickers and records in the modules that use this reference data.
- Permissions: Destination-specific permission applies where documented.
- Reports/lists it appears in: Medications List destination or its related record lists.

### Lists > Pharmacies
- URL: [Open Dental manual](https://www.opendental.com/manual/pharmacies.html)
- Purpose (1–2 sentences): Maintain pharmacies and contact details.
- Screen layout: Destination-specific screen or procedure on the linked page.
- Data fields: Control names and types are not fully enumerated in the retrieved manual text.
- Actions/buttons: Maintain pharmacies and contact details.
- Business rules & logic: The records are maintained as practice reference data.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: Shared pickers and records in the modules that use this reference data.
- Permissions: Destination-specific permission applies where documented.
- Reports/lists it appears in: Pharmacies destination or its related record lists.

### Lists > Rx / Prescriptions List
- URL: [Open Dental manual](https://www.opendental.com/manual/rxsetup.html)
- Purpose (1–2 sentences): Maintain prescription templates.
- Screen layout: Edit Rx Template.
- Data fields: Procedure code required on some prescriptions [checkbox], Controlled Substance [checkbox], Is Proc Required [checkbox].
- Actions/buttons: Add New, RxNorm.
- Business rules & logic: The records are maintained as practice reference data.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: Shared pickers and records in the modules that use this reference data.
- Permissions: Destination-specific permission applies where documented.
- Reports/lists it appears in: Rx / Prescriptions List destination or its related record lists.

### Lists > Problem List
- URL: [Open Dental manual](https://www.opendental.com/manual/problemmaster.html)
- Purpose (1–2 sentences): Maintain the diagnosis/problem dictionary.
- Screen layout: Add or Edit a Problem.
- Data fields: Show Hidden [checkbox], Description [entry], Hidden [checkbox].
- Actions/buttons: Add, Close, ICD-9 Code, ICD-10 Code, SNOMED CT Code, Delete.
- Business rules & logic: The records are maintained as practice reference data.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: Shared pickers and records in the modules that use this reference data.
- Permissions: Destination-specific permission applies where documented.
- Reports/lists it appears in: Problem List destination or its related record lists.

### Lists > Providers
- URL: [Open Dental manual](https://www.opendental.com/manual/providers.html)
- Purpose (1–2 sentences): Maintain treating, billing and other provider records.
- Screen layout: Create Users, Move Patients, Reorder the Provider List.
- Data fields: Search [entry], Show Patient Count [checkbox], Show Hidden [checkbox], Show Deleted [checkbox].
- Actions/buttons: Add, Alphabetize Providers.
- Business rules & logic: The records are maintained as practice reference data.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: Shared pickers and records in the modules that use this reference data.
- Permissions: Patient Primary Provider Edit.
- Reports/lists it appears in: Providers destination or its related record lists.

### Lists > Referral List
- URL: [Open Dental manual](https://www.opendental.com/manual/referralsetup.html)
- Purpose (1–2 sentences): Maintain referral sources and referral contacts.
- Screen layout: Add / Edit Referral Source.
- Data fields: Search [entry], Hidden [checkbox], Not Person [checkbox], Last Name/First Name/Middle Name [entry], Email Trust for Direct [checkbox], Is Doctor [checkbox].
- Actions/buttons: Maintain referral sources and referral contacts.
- Business rules & logic: The records are maintained as practice reference data.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: Shared pickers and records in the modules that use this reference data.
- Permissions: Destination-specific permission applies where documented.
- Reports/lists it appears in: Referral List destination or its related record lists.

### Lists > Site List
- URL: [Open Dental manual](https://www.opendental.com/manual/sites.html)
- Purpose (1–2 sentences): Maintain site lookup records.
- Screen layout: Add or Edit a Site, Claim Details.
- Data fields: Description [entry], Address, City, St, Zip [entry].
- Actions/buttons: Place of Service, Provider.
- Business rules & logic: The records are maintained as practice reference data.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: Shared pickers and records in the modules that use this reference data.
- Permissions: Destination-specific permission applies where documented.
- Reports/lists it appears in: Site List destination or its related record lists.

### Lists > State Abbreviations
- URL: [Open Dental manual](https://www.opendental.com/manual/stateabbreviations.html)
- Purpose (1–2 sentences): Maintain state abbreviation lookup values.
- Screen layout: Destination-specific screen or procedure on the linked page.
- Data fields: Description [entry], Abbreviation [entry], Medicaid ID Length [entry].
- Actions/buttons: Maintain state abbreviation lookup values.
- Business rules & logic: The records are maintained as practice reference data.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: Shared pickers and records in the modules that use this reference data.
- Permissions: Setup security.
- Reports/lists it appears in: State Abbreviations destination or its related record lists.

### Lists > Zip Code List
- URL: [Open Dental manual](https://www.opendental.com/manual/zipcodes.html)
- Purpose (1–2 sentences): Maintain city/state/postal code combinations.
- Screen layout: Add or Edit a Zip Code, Edit Patient Information Window.
- Data fields: Zip Code [entry], City [entry], ST [entry], Used Frequently [checkbox], Edit Zip [entry].
- Actions/buttons: Add, Delete.
- Business rules & logic: The records are maintained as practice reference data.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: Shared pickers and records in the modules that use this reference data.
- Permissions: Destination-specific permission applies where documented.
- Reports/lists it appears in: Zip Code List destination or its related record lists.

### Reports > Graphic Reports
- URL: [Open Dental manual](https://www.opendental.com/manual/reportsgraphic.html)
- Purpose (1–2 sentences): Display practice trends by provider or clinic.
- Screen layout: Print Settings.
- Data fields: Landscape [checkbox].
- Actions/buttons: Setup, Refresh Data, Print Page, Maximizing.
- Business rules & logic: Results use the selected report criteria and authorized report access.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: The relevant module and record type described above.
- Permissions: Destination-specific permission applies where documented.
- Reports/lists it appears in: Reports menu and its generated result.

### Reports > User Query
- URL: [Open Dental manual](https://www.opendental.com/manual/queryoverview.html)
- Purpose (1–2 sentences): Run permitted custom reporting queries.
- Screen layout: Running a Query, Format, Query Results, Find a Query.
- Data fields: Control names and types are not fully enumerated in the retrieved manual text.
- Actions/buttons: Right-Click Options.
- Business rules & logic: Results use the selected report criteria and authorized report access.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: The relevant module and record type described above.
- Permissions: User Query.
- Reports/lists it appears in: Reports menu and its generated result.

### Reports > Query Favorites
- URL: [Open Dental manual](https://www.opendental.com/manual/queryfavorites.html)
- Purpose (1–2 sentences): Organize saved user queries.
- Screen layout: Add or Edit a Query Favorite, Run a Favorite Query.
- Data fields: Search [entry], Wrap Text [checkbox], Title [entry], Export File Name [entry].
- Actions/buttons: Show Text, Hide Text, Delete, Edit.
- Business rules & logic: Results use the selected report criteria and authorized report access.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: The relevant module and record type described above.
- Permissions: Destination-specific permission applies where documented.
- Reports/lists it appears in: Reports menu and its generated result.

### Reports > eService Activity Log
- URL: [Open Dental manual](https://www.opendental.com/manual/eserviceactivitylog.html)
- Purpose (1–2 sentences): Find activity generated by integrated services.
- Screen layout: eService Actions.
- Data fields: From / To [date], Group by LogGuid [checkbox].
- Actions/buttons: Find activity generated by integrated services.
- Business rules & logic: Results use the selected report criteria and authorized report access.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: The relevant module and record type described above.
- Permissions: Destination-specific permission applies where documented.
- Reports/lists it appears in: Reports menu and its generated result.

### Reports > Unfinalized Insurance Payment Report
- URL: [Open Dental manual](https://www.opendental.com/manual/reportunfinalizedinsurancepayments.html)
- Purpose (1–2 sentences): Identify received insurance payments awaiting finalization.
- Screen layout: Filters, Unfinalized Insurance Payment Grid.
- Data fields: Type [entry], Carrier [entry], Carrier [checkbox], Clinic [checkbox], Date [entry].
- Actions/buttons: Open EOB, Delete EOB, Go to Account, Open Claim, Create Check.
- Business rules & logic: Results use the selected report criteria and authorized report access.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: The relevant module and record type described above.
- Permissions: Destination-specific permission applies where documented.
- Reports/lists it appears in: Reports menu and its generated result.

### Tools > Print Screen Tool
- URL: [Open Dental manual](https://www.opendental.com/manual/printscreentool.html)
- Purpose (1–2 sentences): Capture and print or export a screen image.
- Screen layout: Destination-specific screen or procedure on the linked page.
- Data fields: Control names and types are not fully enumerated in the retrieved manual text.
- Actions/buttons: Capture and print or export a screen image.
- Business rules & logic: The operation applies to its selected record or scope.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: The relevant module and record type described above.
- Permissions: Setup commonly governs this menu. Consult the feature's permission documentation for specific overrides.
- Reports/lists it appears in: Print Screen Tool destination or its related record lists.

### Tools > Aging
- URL: [Open Dental manual](https://www.opendental.com/manual/aging.html)
- Purpose (1–2 sentences): Recalculate account balances into aging buckets.
- Screen layout: How Aging is Calculated.
- Data fields: Control names and types are not fully enumerated in the retrieved manual text.
- Actions/buttons: Recalculate account balances into aging buckets.
- Business rules & logic: The operation applies to its selected record or scope.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: The relevant module and record type described above.
- Permissions: Setup commonly governs this menu. Consult the feature's permission documentation for specific overrides.
- Reports/lists it appears in: Aging destination or its related record lists.

### Tools > Audit Trail
- URL: [Open Dental manual](https://www.opendental.com/manual/audittrail.html)
- Purpose (1–2 sentences): Review recorded activity by user, permission event or patient.
- Screen layout: Audit Trail Results, Audit Trail Integrity.
- Data fields: Patient [entry], Current [entry].
- Actions/buttons: Review recorded activity by user, permission event or patient.
- Business rules & logic: The operation applies to its selected record or scope.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: The relevant module and record type described above.
- Permissions: the.
- Reports/lists it appears in: Audit Trail destination or its related record lists.

### Tools > CareCredit Transactions
- URL: [Open Dental manual](https://www.opendental.com/manual/carecredittransactions.html)
- Purpose (1–2 sentences): Review transactions from enabled CareCredit processing.
- Screen layout: Transactions Tab, Quickscreen Transactions Tab, Errors Tab.
- Data fields: Include Acknowledged [checkbox].
- Actions/buttons: Refresh.
- Business rules & logic: The operation applies to its selected record or scope.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: The relevant module and record type described above.
- Permissions: Setup commonly governs this menu. Consult the feature's permission documentation for specific overrides.
- Reports/lists it appears in: CareCredit Transactions destination or its related record lists.

### Tools > Billing/Finance Charges
- URL: [Open Dental manual](https://www.opendental.com/manual/financecharges.html)
- Purpose (1–2 sentences): Generate or review eligible finance charges.
- Screen layout: Date, Billing/Finance Charges, Billing Types, Balances Aged, Billing/Finance Filters, Undo Billing/Finance Charges, Assign Charges.
- Data fields: Date of New Charges [date], Billing Charge [numeric], APR [entry], Exclude bad addresses (no zip code) [checkbox], Exclude inactive families [checkbox], Exclude if insurance pending [checkbox], Exclude accounts (guarantor) without Truth in Lending [checkbox], Exclude if balance less than [numeric], Specific Provider [selector].
- Actions/buttons: Run.
- Business rules & logic: The operation applies to its selected record or scope.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: The relevant module and record type described above.
- Permissions: Setup commonly governs this menu. Consult the feature's permission documentation for specific overrides.
- Reports/lists it appears in: Billing/Finance Charges destination or its related record lists.

### Tools > CC Recurring Charges
- URL: [Open Dental manual](https://www.opendental.com/manual/recurringcharges.html)
- Purpose (1–2 sentences): Manage scheduled card transactions.
- Screen layout: Setup Requirements, Automatic Recurring Charges, Manually Run the CC Recurring Charges Tool.
- Data fields: Clinic Filter [checkbox], Force Duplicates [checkbox].
- Actions/buttons: All, None, History, Send.
- Business rules & logic: The operation applies to its selected record or scope.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: The relevant module and record type described above.
- Permissions: Setup commonly governs this menu. Consult the feature's permission documentation for specific overrides.
- Reports/lists it appears in: CC Recurring Charges destination or its related record lists.

### Tools > Certifications
- URL: [Open Dental manual](https://www.opendental.com/manual/certifications.html)
- Purpose (1–2 sentences): Maintain certifications linked to users or employees.
- Screen layout: Employee Certification.
- Data fields: Show Only Incomplete [checkbox], Sort by Date Completed [checkbox].
- Actions/buttons: Setup.
- Business rules & logic: The operation applies to its selected record or scope.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: The relevant module and record type described above.
- Permissions: Setup commonly governs this menu. Consult the feature's permission documentation for specific overrides.
- Reports/lists it appears in: Certifications destination or its related record lists.

### Tools > Database Maintenance
- URL: [Open Dental manual](https://www.opendental.com/manual/databasemaintenance.html)
- Purpose (1–2 sentences): Run database consistency checks and available repairs.
- Screen layout: Checks Tab, Hidden Tab, Old Tab, Troubleshooting.
- Data fields: Control names and types are not fully enumerated in the retrieved manual text.
- Actions/buttons: Print, Check, Fix, Stop DBM.
- Business rules & logic: The operation applies to its selected record or scope.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: The relevant module and record type described above.
- Permissions: Setup commonly governs this menu. Consult the feature's permission documentation for specific overrides.
- Reports/lists it appears in: Database Maintenance destination or its related record lists.

### Tools > Dental Student Evaluations
- URL: [Open Dental manual](https://www.opendental.com/manual/dsevaluations.html)
- Purpose (1–2 sentences): Manage dental student evaluation workflow.
- Screen layout: Destination-specific screen or procedure on the linked page.
- Data fields: Date [date].
- Actions/buttons: Add, Reports.
- Business rules & logic: The operation applies to its selected record or scope.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: The relevant module and record type described above.
- Permissions: Setup commonly governs this menu. Consult the feature's permission documentation for specific overrides.
- Reports/lists it appears in: Dental Student Evaluations destination or its related record lists.

### Tools > Kiosk Manager
- URL: [Open Dental manual](https://www.opendental.com/manual/kiosk.html)
- Purpose (1–2 sentences): Control patient form kiosk sessions.
- Screen layout: Workflow, Software and Hardware.
- Data fields: Session Name [entry].
- Actions/buttons: Action.
- Business rules & logic: The operation applies to its selected record or scope.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: The relevant module and record type described above.
- Permissions: Setup commonly governs this menu. Consult the feature's permission documentation for specific overrides.
- Reports/lists it appears in: Kiosk Manager destination or its related record lists.

### Tools > Late Charges
- URL: [Open Dental manual](https://www.opendental.com/manual/latecharges.html)
- Purpose (1–2 sentences): Calculate and apply eligible late charges.
- Screen layout: Undo Late Charges.
- Data fields: Date of new charges [date], Exclude accounts (guarantor) without Truth in Lending [checkbox], Exclude existing late charges [checkbox], Only apply to these Billing Types [entry], Guarantor's Primary Provider [checkbox].
- Actions/buttons: Calculate and apply eligible late charges.
- Business rules & logic: The operation applies to its selected record or scope.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: The relevant module and record type described above.
- Permissions: Setup commonly governs this menu. Consult the feature's permission documentation for specific overrides.
- Reports/lists it appears in: Late Charges destination or its related record lists.

### Tools > Mobile Sync Setup
- URL: [Open Dental manual](https://www.opendental.com/manual/mobilesynchupload.html)
- Purpose (1–2 sentences): Configure the legacy mobile synchronization workflow.
- Screen layout: Log In.
- Data fields: Exclude Appointments Before [date].
- Actions/buttons: Configure the legacy mobile synchronization workflow.
- Business rules & logic: The operation applies to its selected record or scope.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: The relevant module and record type described above.
- Permissions: Setup commonly governs this menu. Consult the feature's permission documentation for specific overrides.
- Reports/lists it appears in: Mobile Sync Setup destination or its related record lists.

### Tools > Ortho Auto Claims
- URL: [Open Dental manual](https://www.opendental.com/manual/orthoautoclaim.html)
- Purpose (1–2 sentences): Generate due orthodontic claims from configured terms.
- Screen layout: Ortho Auto Claims Window, Ortho Settings, Insurance Plan Settings, Schedule the Patient's Initial Treatment Procedure, Generate Periodic Ortho Claims using the Ortho Auto Claims Tool, Determining the Next Ortho Claim.
- Data fields: Clinic [selector].
- Actions/buttons: Generate Claims, Account Module, Family Module.
- Business rules & logic: The operation applies to its selected record or scope.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: The relevant module and record type described above.
- Permissions: Setup commonly governs this menu. Consult the feature's permission documentation for specific overrides.
- Reports/lists it appears in: Ortho Auto Claims destination or its related record lists.

### Tools > Patient Dashboard
- URL: [Open Dental manual](https://www.opendental.com/manual/patientdashboard.html)
- Purpose (1–2 sentences): Show selected patient information in a dedicated dashboard.
- Screen layout: Options.
- Data fields: Control names and types are not fully enumerated in the retrieved manual text.
- Actions/buttons: Show selected patient information in a dedicated dashboard.
- Business rules & logic: The operation applies to its selected record or scope.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: The relevant module and record type described above.
- Permissions: Setup commonly governs this menu. Consult the feature's permission documentation for specific overrides.
- Reports/lists it appears in: Patient Dashboard destination or its related record lists.

### Tools > eRouting
- URL: [Open Dental manual](https://www.opendental.com/manual/erouting.html)
- Purpose (1–2 sentences): Route patients through practice statuses and locations.
- Screen layout: Destination-specific screen or procedure on the linked page.
- Data fields: Control names and types are not fully enumerated in the retrieved manual text.
- Actions/buttons: Show All.
- Business rules & logic: The operation applies to its selected record or scope.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: The relevant module and record type described above.
- Permissions: Setup commonly governs this menu. Consult the feature's permission documentation for specific overrides.
- Reports/lists it appears in: eRouting destination or its related record lists.

### Tools > Online Payments
- URL: [Open Dental manual](https://www.opendental.com/manual/portalonlinepayments.html)
- Purpose (1–2 sentences): Review and process patient online payments.
- Screen layout: Process Pending Payments.
- Data fields: Automatically [checkbox].
- Actions/buttons: Review and process patient online payments.
- Business rules & logic: The operation applies to its selected record or scope.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: The relevant module and record type described above.
- Permissions: Setup commonly governs this menu. Consult the feature's permission documentation for specific overrides.
- Reports/lists it appears in: Online Payments destination or its related record lists.

### Tools > Public Health Screening
- URL: [Open Dental manual](https://www.opendental.com/manual/publichealthscreenings.html)
- Purpose (1–2 sentences): Record and review public-health screening events.
- Screen layout: Add screening groups, Set screening permissions.
- Data fields: Control names and types are not fully enumerated in the retrieved manual text.
- Actions/buttons: Record and review public-health screening events.
- Business rules & logic: The operation applies to its selected record or scope.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: The relevant module and record type described above.
- Permissions: Setup commonly governs this menu. Consult the feature's permission documentation for specific overrides.
- Reports/lists it appears in: Public Health Screening destination or its related record lists.

### Tools > Setup Wizard
- URL: [Open Dental manual](https://www.opendental.com/manual/setupwizard.html)
- Purpose (1–2 sentences): Walk through application configuration.
- Screen layout: Registration Key Setup, Basic Feature Setup, Provider Setup, Employee Setup, Fee Schedules, Clinics Setup, Operatory Setup.
- Data fields: Prompt [checkbox], Show me the simple interface [checkbox], Resolution [entry].
- Actions/buttons: Set Up All, Registration Key, Advanced, Hide.
- Business rules & logic: The operation applies to its selected record or scope.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: The relevant module and record type described above.
- Permissions: Setup commonly governs this menu. Consult the feature's permission documentation for specific overrides.
- Reports/lists it appears in: Setup Wizard destination or its related record lists.

### Tools > Open Dental: Web Forms Feature
- URL: [Open Dental manual](https://www.opendental.com/site/webforms.html)
- Purpose (1–2 sentences): Publish and retrieve supported patient Web Forms.
- Screen layout: Getting Started, What Patients See.
- Data fields: Control names and types are not fully enumerated in the retrieved manual text.
- Actions/buttons: Publish and retrieve supported patient Web Forms.
- Business rules & logic: The operation applies to its selected record or scope.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: The relevant module and record type described above.
- Permissions: Setup commonly governs this menu. Consult the feature's permission documentation for specific overrides.
- Reports/lists it appears in: Open Dental: Web Forms Feature destination or its related record lists.

### Tools > Wiki
- URL: [Open Dental manual](https://www.opendental.com/manual/wiki.html)
- Purpose (1–2 sentences): Maintain practice information pages.
- Screen layout: Toolbar, Troubleshooting.
- Data fields: Allow new wiki pages from links [checkbox].
- Actions/buttons: Detect wiki links in textboxes and grids, Home, Save as Home Page, Edit, Print, Rename, Archive, History, Drafts, In-Links, Add, Lists, Search.
- Business rules & logic: The operation applies to its selected record or scope.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: The relevant module and record type described above.
- Permissions: Setup commonly governs this menu. Consult the feature's permission documentation for specific overrides.
- Reports/lists it appears in: Wiki destination or its related record lists.

### Tools > Zoom
- URL: [Open Dental manual](https://www.opendental.com/manual/zoom.html)
- Purpose (1–2 sentences): Change display scale.
- Screen layout: Windows Scaling, Turn Off DPI Awareness, Remote Apps, Window Resizing, Zoom Artifacts.
- Data fields: Control names and types are not fully enumerated in the retrieved manual text.
- Actions/buttons: Change display scale.
- Business rules & logic: The operation applies to its selected record or scope.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: The relevant module and record type described above.
- Permissions: Setup commonly governs this menu. Consult the feature's permission documentation for specific overrides.
- Reports/lists it appears in: Zoom destination or its related record lists.

### Tools > Close Payment Plans
- URL: [Open Dental manual](https://www.opendental.com/manual/paymentplanclose.html)
- Purpose (1–2 sentences): Close selected eligible payment plans.
- Screen layout: Destination-specific screen or procedure on the linked page.
- Data fields: Control names and types are not fully enumerated in the retrieved manual text.
- Actions/buttons: Close selected eligible payment plans.
- Business rules & logic: The operation applies to its selected record or scope.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: The relevant module and record type described above.
- Permissions: Setup commonly governs this menu. Consult the feature's permission documentation for specific overrides.
- Reports/lists it appears in: Close Payment Plans destination or its related record lists.

### Tools > Blockouts
- URL: [Open Dental manual](https://www.opendental.com/manual/blockouts.html)
- Purpose (1–2 sentences): Review or remove duplicated scheduling blocks.
- Screen layout: Edit Blockout, Blockout Cut-Copy-Paste, Block Scheduling.
- Data fields: Control names and types are not fully enumerated in the retrieved manual text.
- Actions/buttons: Review or remove duplicated scheduling blocks.
- Business rules & logic: The operation applies to its selected record or scope.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: The relevant module and record type described above.
- Permissions: Setup commonly governs this menu. Consult the feature's permission documentation for specific overrides.
- Reports/lists it appears in: Blockouts destination or its related record lists.

### Tools > Create AtoZ Folder
- URL: [Open Dental manual](https://www.opendental.com/manual/atozcreate.html)
- Purpose (1–2 sentences): Create the configured document store folder structure.
- Screen layout: Destination-specific screen or procedure on the linked page.
- Data fields: Location of new folder [entry].
- Actions/buttons: Create the configured document store folder structure.
- Business rules & logic: The operation applies to its selected record or scope.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: The relevant module and record type described above.
- Permissions: Setup commonly governs this menu. Consult the feature's permission documentation for specific overrides.
- Reports/lists it appears in: Create AtoZ Folder destination or its related record lists.

### Tools > Database Maintenance for Patient
- URL: [Open Dental manual](https://www.opendental.com/manual/databasemaintenancepat.html)
- Purpose (1–2 sentences): Check or repair information scoped to one patient.
- Screen layout: Destination-specific screen or procedure on the linked page.
- Data fields: Show me everything in the log [checkbox].
- Actions/buttons: Check, Fix.
- Business rules & logic: The operation applies to its selected record or scope.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: The relevant module and record type described above.
- Permissions: Setup commonly governs this menu. Consult the feature's permission documentation for specific overrides.
- Reports/lists it appears in: Database Maintenance for Patient destination or its related record lists.

### Tools > Merge Billing Types
- URL: [Open Dental manual](https://www.opendental.com/manual/mergebillingtypes.html)
- Purpose (1–2 sentences): Consolidate billing type definitions and references.
- Screen layout: Destination-specific screen or procedure on the linked page.
- Data fields: Control names and types are not fully enumerated in the retrieved manual text.
- Actions/buttons: Consolidate billing type definitions and references.
- Business rules & logic: The operation applies to its selected record or scope.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: The relevant module and record type described above.
- Permissions: Setup commonly governs this menu. Consult the feature's permission documentation for specific overrides.
- Reports/lists it appears in: Merge Billing Types destination or its related record lists.

### Tools > Merge Discount Plans
- URL: [Open Dental manual](https://www.opendental.com/manual/mergediscountplans.html)
- Purpose (1–2 sentences): Consolidate duplicate discount plans.
- Screen layout: Destination-specific screen or procedure on the linked page.
- Data fields: Control names and types are not fully enumerated in the retrieved manual text.
- Actions/buttons: Consolidate duplicate discount plans.
- Business rules & logic: The operation applies to its selected record or scope.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: The relevant module and record type described above.
- Permissions: Setup commonly governs this menu. Consult the feature's permission documentation for specific overrides.
- Reports/lists it appears in: Merge Discount Plans destination or its related record lists.

### Tools > Merge Image Categories
- URL: [Open Dental manual](https://www.opendental.com/manual/mergeimagecategories.html)
- Purpose (1–2 sentences): Consolidate duplicate image categories and mapped items.
- Screen layout: Destination-specific screen or procedure on the linked page.
- Data fields: Control names and types are not fully enumerated in the retrieved manual text.
- Actions/buttons: Consolidate duplicate image categories and mapped items.
- Business rules & logic: The operation applies to its selected record or scope.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: The relevant module and record type described above.
- Permissions: Setup commonly governs this menu. Consult the feature's permission documentation for specific overrides.
- Reports/lists it appears in: Merge Image Categories destination or its related record lists.

### Tools > Merge Medications
- URL: [Open Dental manual](https://www.opendental.com/manual/mergemedications.html)
- Purpose (1–2 sentences): Consolidate duplicate medication definitions.
- Screen layout: Destination-specific screen or procedure on the linked page.
- Data fields: Control names and types are not fully enumerated in the retrieved manual text.
- Actions/buttons: Consolidate duplicate medication definitions.
- Business rules & logic: The operation applies to its selected record or scope.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: The relevant module and record type described above.
- Permissions: Setup commonly governs this menu. Consult the feature's permission documentation for specific overrides.
- Reports/lists it appears in: Merge Medications destination or its related record lists.

### Tools > Merge Patients
- URL: [Open Dental manual](https://www.opendental.com/manual/mergepatients.html)
- Purpose (1–2 sentences): Combine duplicate patient records using the designated destination record.
- Screen layout: Destination-specific screen or procedure on the linked page.
- Data fields: Control names and types are not fully enumerated in the retrieved manual text.
- Actions/buttons: Combine duplicate patient records using the designated destination record.
- Business rules & logic: The operation applies to its selected record or scope.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: The relevant module and record type described above.
- Permissions: Setup commonly governs this menu. Consult the feature's permission documentation for specific overrides.
- Reports/lists it appears in: Merge Patients destination or its related record lists.

### Tools > Merge Providers
- URL: [Open Dental manual](https://www.opendental.com/manual/mergeproviders.html)
- Purpose (1–2 sentences): Map source provider references to a retained provider.
- Screen layout: Destination-specific screen or procedure on the linked page.
- Data fields: Control names and types are not fully enumerated in the retrieved manual text.
- Actions/buttons: Map source provider references to a retained provider.
- Business rules & logic: The operation applies to its selected record or scope.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: The relevant module and record type described above.
- Permissions: Setup commonly governs this menu. Consult the feature's permission documentation for specific overrides.
- Reports/lists it appears in: Merge Providers destination or its related record lists.

### Tools > Merge Referrals
- URL: [Open Dental manual](https://www.opendental.com/manual/mergereferrals.html)
- Purpose (1–2 sentences): Consolidate duplicate referral records.
- Screen layout: Destination-specific screen or procedure on the linked page.
- Data fields: Control names and types are not fully enumerated in the retrieved manual text.
- Actions/buttons: Consolidate duplicate referral records.
- Business rules & logic: The operation applies to its selected record or scope.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: The relevant module and record type described above.
- Permissions: Setup commonly governs this menu. Consult the feature's permission documentation for specific overrides.
- Reports/lists it appears in: Merge Referrals destination or its related record lists.

### Tools > Move Subscribers
- URL: [Open Dental manual](https://www.opendental.com/manual/subscribersmove.html)
- Purpose (1–2 sentences): Move applicable subscriber records to a selected destination.
- Screen layout: Destination-specific screen or procedure on the linked page.
- Data fields: Control names and types are not fully enumerated in the retrieved manual text.
- Actions/buttons: Ins plan to move subscribers to, Ins plan to move subscribers from.
- Business rules & logic: The operation applies to its selected record or scope.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: The relevant module and record type described above.
- Permissions: Insurance Plan Change Subscriber.
- Reports/lists it appears in: Move Subscribers destination or its related record lists.

### Tools > Patient Status Setter
- URL: [Open Dental manual](https://www.opendental.com/manual/patientstatussetter.html)
- Purpose (1–2 sentences): Update patient status for a selected cohort.
- Screen layout: Changing the Patient Status.
- Data fields: Patient with Status [selector], Since [selector], Clinic [selector].
- Actions/buttons: Select All, Deselect All.
- Business rules & logic: The operation applies to its selected record or scope.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: The relevant module and record type described above.
- Permissions: Setup commonly governs this menu. Consult the feature's permission documentation for specific overrides.
- Reports/lists it appears in: Patient Status Setter destination or its related record lists.

### Tools > Shutdown Workstations
- URL: [Open Dental manual](https://www.opendental.com/manual/shutdown.html)
- Purpose (1–2 sentences): Send the documented workstation shutdown command.
- Screen layout: Destination-specific screen or procedure on the linked page.
- Data fields: Control names and types are not fully enumerated in the retrieved manual text.
- Actions/buttons: Send the documented workstation shutdown command.
- Business rules & logic: The operation applies to its selected record or scope.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: The relevant module and record type described above.
- Permissions: Setup commonly governs this menu. Consult the feature's permission documentation for specific overrides.
- Reports/lists it appears in: Shutdown Workstations destination or its related record lists.

### Tools > Telephone Numbers
- URL: [Open Dental manual](https://www.opendental.com/manual/telephonenumbers.html)
- Purpose (1–2 sentences): Open stored telephone contact references.
- Screen layout: Destination-specific screen or procedure on the linked page.
- Data fields: Control names and types are not fully enumerated in the retrieved manual text.
- Actions/buttons: Open stored telephone contact references.
- Business rules & logic: The operation applies to its selected record or scope.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: The relevant module and record type described above.
- Permissions: Setup commonly governs this menu. Consult the feature's permission documentation for specific overrides.
- Reports/lists it appears in: Telephone Numbers destination or its related record lists.

### Tools > Test Latency
- URL: [Open Dental manual](https://www.opendental.com/manual/testlatency.html)
- Purpose (1–2 sentences): Measure workstation-to-database responsiveness.
- Screen layout: Destination-specific screen or procedure on the linked page.
- Data fields: Control names and types are not fully enumerated in the retrieved manual text.
- Actions/buttons: Measure workstation-to-database responsiveness.
- Business rules & logic: The operation applies to its selected record or scope.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: The relevant module and record type described above.
- Permissions: Setup commonly governs this menu. Consult the feature's permission documentation for specific overrides.
- Reports/lists it appears in: Test Latency destination or its related record lists.

### Tools > Postcards Setup (Advertising)
- URL: [Open Dental manual](https://www.opendental.com/manual/postcardssetup.html)
- Purpose (1–2 sentences): Configure marketing postcard delivery.
- Screen layout: Post Card Accounts, Clinic Accounts, Troubleshooting.
- Data fields: Account Title [entry], Email [entry], First Name [entry], Last Name [entry], Phone [entry], Mobile [entry].
- Actions/buttons: Add Account, Add, View Account Details, Update.
- Business rules & logic: The operation applies to its selected record or scope.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: The relevant module and record type described above.
- Permissions: Setup commonly governs this menu. Consult the feature's permission documentation for specific overrides.
- Reports/lists it appears in: Postcards Setup (Advertising) destination or its related record lists.

### eServices > eServices Signup
- URL: [Open Dental manual](https://www.opendental.com/manual/eservicessignup.html)
- Purpose (1–2 sentences): Enroll or manage subscriptions for supported connected services.
- Screen layout: Discontinue a Service.
- Data fields: Control names and types are not fully enumerated in the retrieved manual text.
- Actions/buttons: Enroll or manage subscriptions for supported connected services.
- Business rules & logic: Availability and use depend on enabled service and deployment settings.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: Connected Open Dental services and module-specific actions.
- Permissions: Security Admin.
- Reports/lists it appears in: eServices Signup destination or its related record lists.

### eServices > eConnector
- URL: [Open Dental manual](https://www.opendental.com/manual/econnector.html)
- Purpose (1–2 sentences): Install and monitor the service that connects Open Dental to hosted features.
- Screen layout: Install the eConnector on the Server, Automatic Installation, Manual Installation, Install the eConnector on a Workstation.
- Data fields: Password [entry].
- Actions/buttons: None, Stopped, Refresh, Stop Monitoring.
- Business rules & logic: Availability and use depend on enabled service and deployment settings.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: Connected Open Dental services and module-specific actions.
- Permissions: EServicesSetup for editing most eServices windows.
- Reports/lists it appears in: eConnector destination or its related record lists.

### eServices > Device Manager
- URL: [Open Dental manual](https://www.opendental.com/manual/devicemanager.html)
- Purpose (1–2 sentences): Register and manage supported practice devices.
- Screen layout: Destination-specific screen or procedure on the linked page.
- Data fields: Control names and types are not fully enumerated in the retrieved manual text.
- Actions/buttons: ODTouch.
- Business rules & logic: Availability and use depend on enabled service and deployment settings.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: Connected Open Dental services and module-specific actions.
- Permissions: eServices Setup.
- Reports/lists it appears in: Device Manager destination or its related record lists.

### eServices > Mobile Web
- URL: [Open Dental manual](https://www.opendental.com/manual/mobilewebhostedbyod.html)
- Purpose (1–2 sentences): Configure hosted mobile access.
- Screen layout: Mobile Web URL, Setup Users.
- Data fields: Control names and types are not fully enumerated in the retrieved manual text.
- Actions/buttons: Setup Mobile Web Users.
- Business rules & logic: Availability and use depend on enabled service and deployment settings.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: Connected Open Dental services and module-specific actions.
- Permissions: EServicesSetup for editing most eServices windows.
- Reports/lists it appears in: Mobile Web destination or its related record lists.

### eServices > ODTouch Security
- URL: [Open Dental manual](https://www.opendental.com/manual/odtouchsecurity.html)
- Purpose (1–2 sentences): Configure ODTouch access and authentication.
- Screen layout: Destination-specific screen or procedure on the linked page.
- Data fields: Enable Clinical Security [checkbox], Frequency (Minutes) [time].
- Actions/buttons: Configure ODTouch access and authentication.
- Business rules & logic: Availability and use depend on enabled service and deployment settings.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: Connected Open Dental services and module-specific actions.
- Permissions: EServicesSetup for editing most eServices windows.
- Reports/lists it appears in: ODTouch Security destination or its related record lists.

### eServices > Patient Portal
- URL: [Open Dental manual](https://www.opendental.com/manual/portalhostedbyod.html)
- Purpose (1–2 sentences): Configure patient access to portal messages and shared records.
- Screen layout: Patient Facing URL, Construct Hosted URL, Notification Email for Secure WebMail.
- Data fields: Clinic [selector].
- Actions/buttons: Customize URL, Use Hosted, Navigate to URL, Copy to Clipboard, Edit.
- Business rules & logic: Availability and use depend on enabled service and deployment settings.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: Connected Open Dental services and module-specific actions.
- Permissions: EServicesSetup for editing most eServices windows.
- Reports/lists it appears in: Patient Portal destination or its related record lists.

### eServices > Payment Portal Setup
- URL: [Open Dental manual](https://www.opendental.com/manual/paymentportalsetup.html)
- Purpose (1–2 sentences): Configure online bill payment and payment invitations.
- Screen layout: Payment Portal, Message-to-Pay Template, Enable Payment Portal Payments, Provide Patient Access.
- Data fields: Control names and types are not fully enumerated in the retrieved manual text.
- Actions/buttons: Configure online bill payment and payment invitations.
- Business rules & logic: Availability and use depend on enabled service and deployment settings.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: Connected Open Dental services and module-specific actions.
- Permissions: EServicesSetup for editing most eServices windows.
- Reports/lists it appears in: Payment Portal Setup destination or its related record lists.

### eServices > eServices Texting
- URL: [Open Dental manual](https://www.opendental.com/manual/textintegratedusage.html)
- Purpose (1–2 sentences): Review integrated texting usage.
- Screen layout: Date Range, Default Clinic, Text Messaging Phone Number and Usage Summary Grid, OptIn Preferences.
- Data fields: OptIn Office Title [entry].
- Actions/buttons: Save.
- Business rules & logic: Availability and use depend on enabled service and deployment settings.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: Connected Open Dental services and module-specific actions.
- Permissions: EServicesSetup for editing most eServices windows.
- Reports/lists it appears in: eServices Texting destination or its related record lists.

### eServices > Automated Messaging
- URL: [Open Dental manual](https://www.opendental.com/manual/automatedmessaging.html)
- Purpose (1–2 sentences): Configure automatic appointment and related messaging.
- Screen layout: Activate / Deactivate Features, Add Rules, Automated Messaging Rules Grid.
- Data fields: Clinic [selector], Type [entry].
- Actions/buttons: Advanced Settings, Preferences.
- Business rules & logic: Availability and use depend on enabled service and deployment settings.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: Connected Open Dental services and module-specific actions.
- Permissions: EServicesSetup for editing most eServices windows.
- Reports/lists it appears in: Automated Messaging destination or its related record lists.

### eServices > eClipboard Setup
- URL: [Open Dental manual](https://www.opendental.com/manual/eclipboardsetup.html)
- Purpose (1–2 sentences): Configure patient check-in and forms.
- Screen layout: Set Up eClipboard in Open Dental, Install eClipboard on a Tablet Device, Clinic Setup, Behavior Rules, Send eClipboard BYOD to patient phones, Successful Check-in Message, Images.
- Data fields: Use Defaults for this Clinic [checkbox], Clinic [selector], Allow self check-in [entry], Display check-in questions individually [entry], Allow eClipboard BYOD via text messages [checkbox], Minimum Age [entry], Maximum Age [entry].
- Actions/buttons: Add Sheet.
- Business rules & logic: Availability and use depend on enabled service and deployment settings.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: Connected Open Dental services and module-specific actions.
- Permissions: EServicesSetup for editing most eServices windows.
- Reports/lists it appears in: eClipboard Setup destination or its related record lists.

### eServices > eServices Misc
- URL: [Open Dental manual](https://www.opendental.com/manual/eservicesmisctab.html)
- Purpose (1–2 sentences): Set shared timing and other eService defaults.
- Screen layout: Automated eServices Schedule, Same-Day Reminder Exception, Date Format.
- Data fields: Control names and types are not fully enumerated in the retrieved manual text.
- Actions/buttons: Set shared timing and other eService defaults.
- Business rules & logic: Availability and use depend on enabled service and deployment settings.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: Connected Open Dental services and module-specific actions.
- Permissions: EServicesSetup for editing most eServices windows.
- Reports/lists it appears in: eServices Misc destination or its related record lists.

### eServices > Secure Email Setup
- URL: [Open Dental manual](https://www.opendental.com/manual/secureemailsetup.html)
- Purpose (1–2 sentences): Configure supported secure email delivery.
- Screen layout: Setup, Enable Secure Email.
- Data fields: Enabled [checkbox], Default Send [selector].
- Actions/buttons: Configure supported secure email delivery.
- Business rules & logic: Availability and use depend on enabled service and deployment settings.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: Connected Open Dental services and module-specific actions.
- Permissions: EServicesSetup for editing most eServices windows.
- Reports/lists it appears in: Secure Email Setup destination or its related record lists.

### eServices > Mobile Settings
- URL: [Open Dental manual](https://www.opendental.com/manual/mobilesettings.html)
- Purpose (1–2 sentences): Create configuration profiles for mobile apps.
- Screen layout: Recovering Credentials.
- Data fields: Clinic [selector], User Name [entry], Email Address [entry], Phone Number [entry].
- Actions/buttons: Verify and Save.
- Business rules & logic: Availability and use depend on enabled service and deployment settings.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: Connected Open Dental services and module-specific actions.
- Permissions: EServicesSetup for editing most eServices windows.
- Reports/lists it appears in: Mobile Settings destination or its related record lists.

### eServices > Web Sched Recall
- URL: [Open Dental manual](https://www.opendental.com/manual/webschedrecallsetup.html)
- Purpose (1–2 sentences): Offer online recall booking and reminders.
- Screen layout: Recall Types, Operatories Considered, Available Times for Patients, Allowed Blockout Types, Provider Rule, Other Settings, Send Email Messages Automatically To.
- Data fields: Clinic [selector], Prevent double booking [checkbox], Clinic Logic [checkbox].
- Actions/buttons: Edit.
- Business rules & logic: Availability and use depend on enabled service and deployment settings.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: Connected Open Dental services and module-specific actions.
- Permissions: EServicesSetup for editing most eServices windows.
- Reports/lists it appears in: Web Sched Recall destination or its related record lists.

### eServices > Web Sched New Patient
- URL: [Open Dental manual](https://www.opendental.com/manual/webschednewpatsetup.html)
- Purpose (1–2 sentences): Offer online booking for new patients.
- Screen layout: Appointment Types, Operatories Considered, Available Times for Patients, Appointment Message, Allowed Blockout Types, Other Settings, Web Sched New Patient Logic.
- Data fields: Prevent double booking [checkbox], Force United States phone number format [checkbox].
- Actions/buttons: Edit, Date, Insurance Rules, Notification Settings.
- Business rules & logic: Availability and use depend on enabled service and deployment settings.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: Connected Open Dental services and module-specific actions.
- Permissions: EServicesSetup for editing most eServices windows.
- Reports/lists it appears in: Web Sched New Patient destination or its related record lists.

### eServices > Web Sched Existing Patient
- URL: [Open Dental manual](https://www.opendental.com/manual/webschedexistingpatsetup.html)
- Purpose (1–2 sentences): Offer online booking for existing patients.
- Screen layout: Appointment Types, Operatories Considered, Available Times for Patients, Appointment Message, Allowed Blockout Types, Other Settings, Web Sched Existing Patient Logic.
- Data fields: Prevent double booking [checkbox], Allow disabled recalls [checkbox], Recall display name [entry].
- Actions/buttons: Edit, Date, Insurance Rules, Notification Settings.
- Business rules & logic: Availability and use depend on enabled service and deployment settings.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: Connected Open Dental services and module-specific actions.
- Permissions: EServicesSetup for editing most eServices windows.
- Reports/lists it appears in: Web Sched Existing Patient destination or its related record lists.

### eServices > Web Sched Advanced
- URL: [Open Dental manual](https://www.opendental.com/manual/webschedadvanced.html)
- Purpose (1–2 sentences): Build advanced booking URLs within configured options.
- Screen layout: Clinics, Options, URLs, Other URL Options.
- Data fields: Control names and types are not fully enumerated in the retrieved manual text.
- Actions/buttons: Web Form to Launch after scheduling New Pat, Web Form to Launch after scheduling Existing Pat.
- Business rules & logic: Availability and use depend on enabled service and deployment settings.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: Connected Open Dental services and module-specific actions.
- Permissions: EServicesSetup for editing most eServices windows.
- Reports/lists it appears in: Web Sched Advanced destination or its related record lists.

### eServices > ODMobile
- URL: [Open Dental manual](https://www.opendental.com/manual/opendentalmobile.html)
- Purpose (1–2 sentences): Configure access to the practice through ODMobile.
- Screen layout: Set Up ODMobile in Open Dental, Install Open Dental on a Mobile Device.
- Data fields: Control names and types are not fully enumerated in the retrieved manual text.
- Actions/buttons: Configure access to the practice through ODMobile.
- Business rules & logic: Availability and use depend on enabled service and deployment settings.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: Connected Open Dental services and module-specific actions.
- Permissions: ODTouch/ODMobile security.
- Reports/lists it appears in: ODMobile destination or its related record lists.

### eServices > ODTouch Setup
- URL: [Open Dental manual](https://www.opendental.com/manual/odtouchsetup.html)
- Purpose (1–2 sentences): Configure ODTouch clinical access.
- Screen layout: Set Up ODTouch in Open Dental, Install ODTouch on a Tablet Device.
- Data fields: Control names and types are not fully enumerated in the retrieved manual text.
- Actions/buttons: Configure ODTouch clinical access.
- Business rules & logic: Availability and use depend on enabled service and deployment settings.
- Statuses/workflow: No separate fixed lifecycle extracted for this entry.
- Links to other modules: Connected Open Dental services and module-specific actions.
- Permissions: ODTouch/ODMobile security.
- Reports/lists it appears in: ODTouch Setup destination or its related record lists.


## Cross-module status, color and report reference


### Setup > Chart Graphic Colors and Account Colors
- URL: [Open Dental manual](https://opendental.com/Manual/definitionschartgraphiccolors.html)
- Purpose (1–2 sentences): Configure procedure graphics and financial ledger text colors.
- Screen layout: Definitions category list, fixed color items and picker.
- Data fields: Chart color keys include Treatment Planned, Complete, Existing Current Prov, Existing Other Prov, Referred Out and Condition with light variants; Main Background, Text, Highlighted Text, Highlighted Background, Background on TPs and Text on TPs. Account color keys include Default, Adjustments, Discounts, Patient Payments, Insurance, Comm, PayPlan, Insurance Payment, Received Ins Claim, Received Pre-Auth, Broken Appointment Procedure and Canceled Appointment Procedure.
- Actions/buttons: Double-click item, select color and Save.
- Business rules & logic: Chart procedure code override or provider-color preference can change display. Account keys apply by record type/status. Broken and canceled procedure color keys map to D9986 and D9987. Documentation describes configurable colors without a universal RGB/hex mapping.
- Statuses/workflow: Chart procedure statuses and Account claim states determine which configured color applies. Received Pre-Auth is a permanently hidden Account color definition.
- Links to other modules: Graphical Tooth Chart, Progress Notes, Treatment Plan output and Account ledger.
- Permissions: Setup for editing definitions.
- Reports/lists it appears in: Definitions and dependent module views.


### Reports > Standard report catalog
- URL: [Open Dental manual](https://www.opendental.com/manual/reportsstandard.html)
- Purpose (1–2 sentences): Locate recurring practice reports and authorized output.
- Screen layout: Production and Income shortcuts and Daily, Monthly, Lists and Public Health sections.
- Data fields: Report selection; report-specific dates, providers, clinics and outputs. Setup sections include Display Settings, Security Permissions, Report Server and Misc Settings.
- Actions/buttons: Run shortcut or open report parameters. Open User Query or Laser Labels. Set favorites/visibility and group access.
- Business rules & logic: Yesterday production on Mondays runs the preceding Friday. Report Server can offload Production and Income. Locked reports follow group access.
- Statuses/workflow: Available, Favorite or Locked.
- Links to other modules: Account, Claims, Family, Chart, Appointments, eServices and Public Health.
- Permissions: Standard report-specific group grants.
- Reports/lists it appears in: Production: Monthly Production Goal and Provider Payroll Summary/Detail. Daily: Adjustments, Incomplete Procedure Notes, Net Production Detail, Patient Portion Uncollected, Payments, Procedures, Routing Slips, Unfinalized Insurance Payment, Write-off. Monthly: A/R Aging, Capitation Utilization, Claims Not Sent, Custom Aging, Finance Charge, Insurance Aging, Insurance Overpaid, Insurance Payment Plans Past Due, Outstanding Insurance Claims, Payment Plans, PPO Write-offs, Presented Treatment Production, Treatment Plan Presentation Statistics, Procedures Not Billed to Insurance, Procedures Overpaid, Receivables Breakdown, Unearned Income, Payment Plans Overcharged. Lists: Active Patients, Appointments, Birthdays/Postcards, Broken Appointments, Discount Plans, Insurance Plans, New Patients, Patient Raw, Patient Notes, Prescriptions, Procedure Codes/Fee Schedules, Referral Raw, Referral Analysis, Referred Procedure Tracking, Treatment Finder, Web Sched Appointments, Hidden Payment Splits, ERAs Automatically Processed. Public Health: FQHC Dental Sealant Measure, Raw Screening Data and Raw Population Data.

## Part 7 · Expanded Main Toolbar


### Toolbar > Shared toolbar
- URL: [Open Dental manual](https://opendental.com/manual/toolbar.html)
- Purpose (1–2 sentences): Expose patient selection and common communications and forms functions in every module.
- Screen layout: Horizontal strip below menu with buttons and dropdown variants.
- Data fields: Current patient [shared context]; menu availability depends on setup.
- Actions/buttons: Select Patient, Commlog, Email, WebMail, Text Message, Letter, Forms, Tasks, Label and Popups.
- Business rules & logic: Main click usually targets current patient. Dropdown variants can target referrals, recent/family patients, messaging inbox, task lists or alternate label formats. New task badge is orange. Reminder count uses nonlegacy task behavior.
- Statuses/workflow: Current patient shared across modules; new task badge counts pending items.
- Links to other modules: All modules, patient record, task areas and messaging eServices.
- Permissions: Each launched operation has its own permissions and feature requirements.
- Reports/lists it appears in: Recent patients, subscribed tasks, communications and forms.


### Toolbar > Select Patient
- URL: [Open Dental manual](https://www.opendental.com/manual/patientselect.html)
- Purpose (1–2 sentences): Open an existing record or create new patient/family records.
- Screen layout: Search inputs, configurable results grid, paging and patient creation actions; toolbar dropdown for recently selected patients and current family.
- Data fields: First/last name, patient identifier and SSN [text], birthdate [date], billing type/site/clinic [configured], Guarantors Only, Show Inactive, Show Archived/Deceased/Hidden Clinics, Show Merged and Refresh while typing [checkboxes].
- Actions/buttons: Ctrl+P, Search, Previous/Next 40, Get All, Add Pt, Add Many, OK/double-click or keyboard selection; dropdown lists last five and family.
- Business rules & logic: Default search shows up to 40 prefix matches with exact matches first. Get All supports substring matches and omits last/next visit values. Creating records requires a last-name search first. Names and birthdate can carry into creation. Clinic filters can include patients linked by appointments. Masked full SSN has separate permission.
- Statuses/workflow: Matched → selected in current module, or new patient/family created when no match.
- Links to other modules: Family and Account patient grids, original module context, Appointments and Display Fields.
- Permissions: Patient Social Security Number View for unmasking, plus patient create permissions for add workflows.
- Reports/lists it appears in: Select Patient, recent patients and family dropdown.


### Toolbar > Commlog
- URL: [Open Dental manual](https://opendental.com/manual/commlog.html)
- Purpose (1–2 sentences): Enter structured communication history for a patient.
- Screen layout: Patient and date header, type/mode/direction choices, note/signature region and action buttons.
- Data fields: Patient and Created timestamp [read-only], Date/Time [editable], Type [configured; defaults ApptRelated, Insurance, Financial, Recall, Misc, FHIR], Mode [None, Email, Mail, Phone, In Person, Text, Email and Text, Phone and Text, Fax], Direction [Neither, Sent, Received], Note [multiline], signature and applicable attachments.
- Actions/buttons: Add or edit Auto Note, clear text, sign, attach supported files, save/delete.
- Business rules & logic: Effective date sorts Chart and Account entries. Editing clears saved signatures. Some workflows automatically create entries; Enterprise can default fields blank.
- Statuses/workflow: Manual or automatic entry → saved/signed → optionally edited/deleted as allowed.
- Links to other modules: Account, Progress Notes, appointment communications, Recall and FHIR.
- Permissions: Commlog action permissions and date restrictions where applicable.
- Reports/lists it appears in: Account Communications Log, Chart Progress Notes and appointment history.


### Toolbar > Email
- URL: [Open Dental manual](https://opendental.com/manual/emailmessage.html)
- Purpose (1–2 sentences): Compose patient/referral email or view existing messages.
- Screen layout: Sender/recipient header, subject/body, attachment list and send controls.
- Data fields: From [configured], To/CC/BCC [email addresses], Subject/Body [text], attachment [file or patient image], Username, Sent/Received and Date/Time [system fields].
- Actions/buttons: Send, select referral from toolbar dropdown, add file/image, open/rename/remove attachments, view/delete message and use configured secure-send option when available.
- Business rules & logic: Patient email supplies default To. Sender setup can insert autograph. Secure Email excludes CC/BCC. Deleting sent item from client can preserve patient history and server copy.
- Statuses/workflow: Neither/Unsent → Sent, or Received for inbound mail.
- Links to other modules: Email Setup and Client, Imaging and patient/referral data.
- Permissions: Email access/configuration and provider settings determine availability.
- Reports/lists it appears in: Sent/received email, Chart and Account history, appointment eConfirmation/eReminder history.


### Toolbar > WebMail
- URL: [Open Dental manual](https://opendental.com/manual/securewebmailsend.html)
- Purpose (1–2 sentences): Send secure portal messages associated with specific patients and providers.
- Screen layout: Regarding Patient and From fields, composer, attachment/preview controls.
- Data fields: Regarding Patient [family dropdown], From [provider picker], Subject and Message [text], attachment [file].
- Actions/buttons: Setup, Attach, Preview, Send and Delete.
- Business rules & logic: Patient must have email and a primary provider. From defaults to primary provider. Sending under another provider can require that provider's password. Patient receives portal notification.
- Statuses/workflow: Composed → sent to portal → notification; alerts can surface replies.
- Links to other modules: Patient Portal, email notification setup and provider authorization.
- Permissions: Provider credential requirement and configured portal access.
- Reports/lists it appears in: WebMail communications and user alerts.


### Toolbar > Text Message
- URL: [Open Dental manual](https://opendental.com/manual/textmessages.html)
- Purpose (1–2 sentences): Compose a patient or ad hoc SMS and open the texting inbox.
- Screen layout: Recipient mode, phone field, message editor with character/segment counters, and send controls.
- Data fields: Recipient mode [Patient, Another Person], selected patient [picker], Wireless Phone Number [text], Text Message [text], character and message counts [derived].
- Actions/buttons: Find another patient, enter non-patient number, Send; dropdown opens received/sent texts for Integrated Texting.
- Business rules & logic: Button enables with texting configured. Patient texts write a Commlog using configured type. Segment count updates with body.
- Statuses/workflow: Composed → sent or failed; incoming messages appear in inbox.
- Links to other modules: Integrated Texting, patient wireless data, Appointments and Commlog.
- Permissions: Service eligibility and communication controls apply.
- Reports/lists it appears in: Text Messaging inbox and patient commlog.


### Toolbar > Letter
- URL: [Open Dental manual](https://opendental.com/manual/letterspatient.html)
- Purpose (1–2 sentences): Generate a patient or referral letter using Sheets.
- Screen layout: Toolbar button/dropdown, sheet chooser and filled-sheet editor/output.
- Data fields: Letter template [configured], patient/referral [record], template-defined inputs.
- Actions/buttons: Create patient letter, choose referral letter or merge letters from dropdown, preview/edit and print or save as supported.
- Business rules & logic: Merge fields use associated patient/referral data. Letter options depend on configured templates.
- Statuses/workflow: Template selected → generated → saved/output as applicable.
- Links to other modules: Sheets, Family referrals, communications and imaging where applicable.
- Permissions: Sheet permissions and access to relevant patient record.
- Reports/lists it appears in: Patient letters, referral letters and printable sheets.


### Toolbar > Forms
- URL: [Open Dental manual](https://opendental.com/manual/patientform.html)
- Purpose (1–2 sentences): Maintain forms and import completed patient-entered data.
- Screen layout: Forms grid, sort and setup controls, sheet chooser and Kiosk workflow.
- Data fields: Sort and form type [selections], Search [text], show consent option [checkbox], selected forms and template-defined inputs/signature.
- Actions/buttons: Setup Sheets/Image Categories/Options, Add, To Kiosk, Kiosk, Copy, Pre-Fill, Import and double-click editing.
- Business rules & logic: Pre-Fill combines database/form data according to field rules. Import commits supported completed fields. Kiosk queues selected forms. Templates control available fields.
- Statuses/workflow: Created → queued/filled → signed when applicable → imported where supported.
- Links to other modules: Family demographics, Chart medical history, Sheets, Kiosk and Imaging.
- Permissions: Forms/Sheets and target-field edit permissions as applicable.
- Reports/lists it appears in: Patient Forms list, Kiosk queue and saved patient output.


### Toolbar > Tasks and reminders
- URL: [Open Dental manual](https://opendental.com/manual/tasks.html)
- Purpose (1–2 sentences): Assign work about the current patient and track reminders.
- Screen layout: Task List chooser, task editor, notifications dropdown, tasks and reminder tabs.
- Data fields: Search and task note [text], destination list [configured], Send copies to multiple and Show all task lists [checkboxes], status, priority [configured], date/time, Reminder Type [NoReminder, Once, Daily, Weekly, Monthly, Yearly], recurrence interval and weekdays.
- Actions/buttons: Send to task list, attach patient/appointment, add note, select due/recurrence, mark done, view subscribed/inbox/reminder items and optionally Show Finished Tasks.
- Business rules & logic: Destination can be a nested list. Reminder recurrence uses interval and due time, plus selected days for weekly. Orange badge counts new tasks, with reminder totals only if legacy repeating lists are disabled.
- Statuses/workflow: New/open → Done; due recurring reminders follow their schedule.
- Links to other modules: Tasks Area, appointments and Chart/Account patient context.
- Permissions: Task List access and applicable task editing permissions.
- Reports/lists it appears in: Tasks up top, Tasks Area, appointment tasks and reminders.


### Toolbar > Labels
- URL: [Open Dental manual](https://opendental.com/manual/labels.html)
- Purpose (1–2 sentences): Print labels for patients and associated record types.
- Screen layout: Label button/dropdown, template/record selection and printer output.
- Data fields: Label format [configured], patient, carrier or referral [record], label printer [configured].
- Actions/buttons: Main click prints configured patient mailing label; dropdown picks alternate patient, insurance or referral label; appointment context prints single appointment label.
- Business rules & logic: Default patient format is internal Label Patient Mail unless configured otherwise. Templates and printer defaults control formatting and routing.
- Statuses/workflow: Selected → printed.
- Links to other modules: Sheets, Printers, insurance/referrals, appointment labels and reports.
- Permissions: Relevant patient and setup permissions for templates/printers.
- Reports/lists it appears in: Single labels and Reports Laser Labels.


### Toolbar > Popups
- URL: [Open Dental manual](https://opendental.com/manual/popups.html)
- Purpose (1–2 sentences): Display a saved warning or notice when switching to a patient record.
- Screen layout: Popups for Family list, optional deleted view, editor and per-popup audit.
- Data fields: Level [Patient, Family, Superfamily when eligible], Date Time Disabled [datetime], Popup Message [text], Show Deleted [checkbox].
- Actions/buttons: Add/edit, Now sets disabling timestamp, Delete, view audit.
- Business rules & logic: Changing module alone does not trigger popup. A future disabled timestamp stops triggering after that time. Audit records message changes but not level changes, disable or delete. Own popups are editable without Edit Popup.
- Statuses/workflow: Active → disabled by date or deleted; history remains accessible in appropriate view.
- Links to other modules: Patient selection, Family/Super Family and Preferences.
- Permissions: Edit Popup required to edit/delete another user's popup.
- Reports/lists it appears in: Popups for Family and popup message Audit Trail.

