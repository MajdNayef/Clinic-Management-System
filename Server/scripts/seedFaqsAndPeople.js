// ────────────────────────────────────────────────────────────────────────────
//  SEVEN EXTRA DOCTORS  – identical pattern: user → doctor
// ────────────────────────────────────────────────────────────────────────────

// ── 1. Dr Ahmed Musa ────────────────────────────────────────────────
const ahmedUserId = ObjectId("6820bbccdd11223344556671");
const ahmedDocId  = ObjectId("6860ccddeeff001122334461");

db.users.insertOne({
  _id: ahmedUserId,
  first_name: "Dr Ahmed",
  last_name:  "Musa",
  phone_number: "60110001001",
  address: "Kuala Lumpur",
  email: "ahmed.musa@dmc.my",
  password: "$2b$12$AhmedDummyHash=============",
  role: "Doctor",
  notifications_enabled: true,
  createdAt: new Date(),
  profile_image: "/uploads/avatars/ahmed.png"
});

db.doctors.insertOne({
  _id: ahmedDocId,
  user_id: ahmedUserId,
  available_days: ["Monday", "Thursday"],
  bio: "Orthopaedic surgeon specialising in sports injuries.",
  specialization: "Orthopaedics",
  available_start_time: "08:00",
  available_end_time: "16:00",
  years_of_experience: "12"
});

// ── 2. Dr Lim Wei Ling ─────────────────────────────────────────────
const limUserId = ObjectId("6820bbccdd11223344556672");
const limDocId  = ObjectId("6860ccddeeff001122334462");

db.users.insertOne({
  _id: limUserId,
  first_name: "Dr Lim",
  last_name:  "Wei Ling",
  phone_number: "60110001002",
  address: "Penang",
  email: "lim.weiling@dmc.my",
  password: "$2b$12$LimDummyHash================",
  role: "Doctor",
  notifications_enabled: true,
  createdAt: new Date(),
  profile_image: "/uploads/avatars/lim.png"
});

db.doctors.insertOne({
  _id: limDocId,
  user_id: limUserId,
  available_days: ["Tuesday", "Friday"],
  bio: "Consultant paediatrician focused on community child health.",
  specialization: "Paediatrics",
  available_start_time: "09:00",
  available_end_time: "17:00",
  years_of_experience: "8"
});

// ── 3. Dr Priya Nair ───────────────────────────────────────────────
const priyaUserId = ObjectId("6820bbccdd11223344556673");
const priyaDocId  = ObjectId("6860ccddeeff001122334463");

db.users.insertOne({
  _id: priyaUserId,
  first_name: "Dr Priya",
  last_name:  "Nair",
  phone_number: "60110001003",
  address: "Johor Bahru",
  email: "priya.nair@dmc.my",
  password: "$2b$12$PriyaDummyHash==============",
  role: "Doctor",
  notifications_enabled: true,
  createdAt: new Date(),
  profile_image: "/uploads/avatars/priya.png"
});

db.doctors.insertOne({
  _id: priyaDocId,
  user_id: priyaUserId,
  available_days: ["Monday", "Wednesday"],
  bio: "OB-GYN providing holistic women’s health services.",
  specialization: "Obstetrics & Gynaecology",
  available_start_time: "08:30",
  available_end_time: "15:30",
  years_of_experience: "11"
});

// ── 4. Dr Henry Tan ────────────────────────────────────────────────
const henryUserId = ObjectId("6820bbccdd11223344556674");
const henryDocId  = ObjectId("6860ccddeeff001122334464");

db.users.insertOne({
  _id: henryUserId,
  first_name: "Dr Henry",
  last_name:  "Tan",
  phone_number: "60110001004",
  address: "Kuching",
  email: "henry.tan@dmc.my",
  password: "$2b$12$HenryDummyHash==============",
  role: "Doctor",
  notifications_enabled: true,
  createdAt: new Date(),
  profile_image: "/uploads/avatars/henry.png"
});

db.doctors.insertOne({
  _id: henryDocId,
  user_id: henryUserId,
  available_days: ["Thursday"],
  bio: "Neurologist specialising in stroke and movement disorders.",
  specialization: "Neurology",
  available_start_time: "10:00",
  available_end_time: "18:00",
  years_of_experience: "15"
});

// ── 5. Dr Nurul Farihah ────────────────────────────────────────────
const nurulUserId = ObjectId("6820bbccdd11223344556675");
const nurulDocId  = ObjectId("6860ccddeeff001122334465");

db.users.insertOne({
  _id: nurulUserId,
  first_name: "Dr Nurul",
  last_name:  "Farihah",
  phone_number: "60110001005",
  address: "Kota Bharu",
  email: "nurul.farihah@dmc.my",
  password: "$2b$12$NurulDummyHash==============",
  role: "Doctor",
  notifications_enabled: true,
  createdAt: new Date(),
  profile_image: "/uploads/avatars/nurul.png"
});

db.doctors.insertOne({
  _id: nurulDocId,
  user_id: nurulUserId,
  available_days: ["Sunday", "Tuesday"],
  bio: "Family physician emphasising preventive and lifestyle medicine.",
  specialization: "Family Medicine",
  available_start_time: "09:00",
  available_end_time: "16:30",
  years_of_experience: "9"
});

// ── 6. Dr John Lee ────────────────────────────────────────────────
const johnUserId = ObjectId("6820bbccdd11223344556676");
const johnDocId  = ObjectId("6860ccddeeff001122334466");

db.users.insertOne({
  _id: johnUserId,
  first_name: "Dr John",
  last_name:  "Lee",
  phone_number: "60110001006",
  address: "Ipoh",
  email: "john.lee@dmc.my",
  password: "$2b$12$JohnDummyHash===============",
  role: "Doctor",
  notifications_enabled: true,
  createdAt: new Date(),
  profile_image: "/uploads/avatars/john.png"
});

db.doctors.insertOne({
  _id: johnDocId,
  user_id: johnUserId,
  available_days: ["Wednesday", "Friday"],
  bio: "ENT surgeon with a subspecialty in paediatric otolaryngology.",
  specialization: "ENT",
  available_start_time: "08:00",
  available_end_time: "14:00",
  years_of_experience: "6"
});

// ── 7. Dr Anwar Kadir ──────────────────────────────────────────────
const anwarUserId = ObjectId("6820bbccdd11223344556677");
const anwarDocId  = ObjectId("6860ccddeeff001122334467");

db.users.insertOne({
  _id: anwarUserId,
  first_name: "Dr Anwar",
  last_name:  "Kadir",
  phone_number: "60110001007",
  address: "Seremban",
  email: "anwar.kadir@dmc.my",
  password: "$2b$12$AnwarDummyHash==============",
  role: "Doctor",
  notifications_enabled: true,
  createdAt: new Date(),
  profile_image: "/uploads/avatars/anwar.png"
});

db.doctors.insertOne({
  _id: anwarDocId,
  user_id: anwarUserId,
  available_days: ["Monday", "Thursday"],
  bio: "General surgeon experienced in laparoscopic procedures.",
  specialization: "General Surgery",
  available_start_time: "08:00",
  available_end_time: "17:00",
  years_of_experience: "13"
});

print("\n✅  Seven additional doctors inserted.\n");
