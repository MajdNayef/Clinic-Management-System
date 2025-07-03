import React, { useEffect, useState } from "react";
import axios from "axios";
import DashboardLayout from "./layout/DashboardLayout";
import styles from "./css/manageusers.module.css";

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [doctorData, setDoctorData] = useState({});
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState({
    show: false,
    userId: null,
  });

  /* ------------------------------------------------------------------
     LOAD + FILTER
  ------------------------------------------------------------------ */
  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [search, roleFilter, users]);

  async function fetchUsers() {
    setLoading(true);
    try {
      const { data } = await axios.get("/api/admin/users");
      setUsers(data);
    } catch (err) {
      alert("Failed to fetch users");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function filterUsers() {
    const q = search.toLowerCase();
    setFilteredUsers(
      users.filter((u) => {
        const matchesSearch =
          u.first_name.toLowerCase().includes(q) ||
          u.last_name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q);
        const matchesRole = roleFilter === "All" || u.role === roleFilter;
        return matchesSearch && matchesRole;
      })
    );
  }

  /* ------------------------------------------------------------------
     EDIT / SAVE
  ------------------------------------------------------------------ */
  const handleEdit = async (user) => {
    setEditingId(user._id);
    setEditData({ ...user });
    if (user.role === "Doctor") {
      try {
        const { data } = await axios.get(`/api/admin/doctor/${user._id}`);
        setDoctorData(data);
      } catch (err) {
        console.error("Failed to load doctor details", err);
        setDoctorData({});
      }
    } else {
      setDoctorData({});
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditData((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
  };

  const handleDoctorChange = (e) => {
    const { name, value } = e.target;
    setDoctorData((p) => ({ ...p, [name]: value }));
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditData({});
    setDoctorData({});
  };

  const handleSave = async () => {
    try {
      const { user_id, ...cleanDoctorData } = doctorData;
      if (editData.role === "Doctor") {
        cleanDoctorData.available_days = Array.isArray(
          cleanDoctorData.available_days
        )
          ? cleanDoctorData.available_days
          : typeof cleanDoctorData.available_days === "string"
            ? cleanDoctorData.available_days.split(",").map((d) => d.trim())
            : [];
      }
      const payload = {
        ...editData,
        doctorData: editData.role === "Doctor" ? cleanDoctorData : undefined,
      };
      const updated = await axios.put(`/api/admin/users/${editingId}`, payload);
      setUsers((u) =>
        u.map((usr) => (usr._id === editingId ? updated.data : usr))
      );
      handleCancel();
    } catch (err) {
      alert("Failed to update user");
      console.error(err);
    }
  };

  /* ------------------------------------------------------------------
     DELETE
  ------------------------------------------------------------------ */
  const handleDelete = (id) => setConfirmDelete({ show: true, userId: id });

  const confirmDeleteUser = async () => {
    try {
      await axios.delete(`/api/admin/users/${confirmDelete.userId}`);
      await fetchUsers();
      setConfirmDelete({ show: false, userId: null });
    } catch (err) {
      alert("Failed to delete user");
      console.error(err);
    }
  };

  const cancelDelete = () => setConfirmDelete({ show: false, userId: null });

  /* ------------------------------------------------------------------
     RENDER
  ------------------------------------------------------------------ */
  return (
    <DashboardLayout>
      <h2 className={styles.sectionTitle}>Manage MedConnect Users</h2>
      <hr />
      <div className={styles.container}>
        {/* Search & role filter */}
        <div className={styles.controls}>
          <input
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />

          <div className={styles.roleTabs}>
            {["All", "Patient", "Doctor", "Admin", "Pharmacist"].map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={roleFilter === r ? styles.activeTab : styles.tab}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Card grid */}
        {loading ? (
          <p>Loading users…</p>
        ) : (
          <div className={styles.cardGrid}>
            {filteredUsers.map((u) => (
              <div key={u._id} className={styles.userCard}>
                {/* header */}
                <div className={styles.userDetails}>
                  <div className={styles.avatarCircle}>
                    {u.first_name?.[0]}
                    {u.last_name?.[0]}
                  </div>
                  <div>
                    {editingId === u._id ? (
                      <>
                        <input
                          name="first_name"
                          value={editData.first_name}
                          onChange={handleChange}
                        />
                        <input
                          name="last_name"
                          value={editData.last_name}
                          onChange={handleChange}
                        />
                      </>
                    ) : (
                      <h4>
                        {u.first_name} {u.last_name}
                      </h4>
                    )}
                    {editingId === u._id ? (
                      <input
                        name="email"
                        value={editData.email}
                        onChange={handleChange}
                      />
                    ) : (
                      <p className={styles.meta}>{u.email}</p>
                    )}
                    <p className={styles.meta}>
                      Role:{" "}
                      {editingId === u._id ? (
                        <select
                          name="role"
                          value={editData.role}
                          onChange={handleChange}
                        >
                          <option value="Patient">Patient</option>
                          <option value="Doctor">Doctor</option>
                          <option value="Admin">Admin</option>
                          <option value="Pharmacist">Pharmacist</option>
                        </select>
                      ) : (
                        u.role || "-"
                      )}
                    </p>
                  </div>
                </div>

                {/* meta / editable fields */}
                <div className={styles.metaBlock}>
                  <div>
                    <strong>Phone:</strong>{" "}
                    {editingId === u._id ? (
                      <input
                        name="phone_number"
                        value={editData.phone_number}
                        onChange={handleChange}
                      />
                    ) : (
                      u.phone_number
                    )}
                  </div>

                  <div>
                    <strong>Address:</strong>{" "}
                    {editingId === u._id ? (
                      <input
                        name="address"
                        value={editData.address}
                        onChange={handleChange}
                      />
                    ) : (
                      u.address
                    )}
                  </div>

                  <div>
                    <strong>Joined:</strong>{" "}
                    {new Date(u.createdAt).toLocaleDateString()}
                  </div>

                  {editingId === u._id ? (
                    <div>
                      <label>
                        <strong>Notifications:</strong>{" "}
                        <input
                          type="checkbox"
                          name="notifications_enabled"
                          checked={editData.notifications_enabled}
                          onChange={handleChange}
                        />
                      </label>
                    </div>
                  ) : (
                    <div>
                      <strong>Notifications:</strong>{" "}
                      {u.notifications_enabled ? "✅" : "❌"}
                    </div>
                  )}

                  {/* doctor-only extra fields */}
                  {u.role === "Doctor" && editingId === u._id && (
                    <div className={styles.doctorSection}>
                      <label>
                        Specialization:
                        <input
                          name="specialization"
                          value={doctorData.specialization || ""}
                          onChange={handleDoctorChange}
                        />
                      </label>

                      <label>
                        Years of Experience:
                        <input
                          type="number"
                          name="years_of_experience"
                          value={doctorData.years_of_experience || 0}
                          onChange={handleDoctorChange}
                        />
                      </label>

                      <label>
                        Bio:
                        <textarea
                          name="bio"
                          value={doctorData.bio || ""}
                          onChange={handleDoctorChange}
                        />
                      </label>

                      <label>
                        Available Days:
                        <input
                          name="available_days"
                          value={(doctorData.available_days || []).join(", ")}
                          onChange={(e) =>
                            setDoctorData((p) => ({
                              ...p,
                              available_days: e.target.value
                                .split(",")
                                .map((d) => d.trim()),
                            }))
                          }
                        />
                      </label>

                      <label>
                        Start Time:
                        <input
                          type="time"
                          name="available_start_time"
                          value={doctorData.available_start_time || ""}
                          onChange={handleDoctorChange}
                        />
                      </label>

                      <label>
                        End Time:
                        <input
                          type="time"
                          name="available_end_time"
                          value={doctorData.available_end_time || ""}
                          onChange={handleDoctorChange}
                        />
                      </label>
                    </div>
                  )}
                </div>

                {/* buttons */}
                <div className={styles.actions}>
                  {editingId === u._id ? (
                    <>
                      <button
                        onClick={handleSave}
                        className={styles.saveBtn}
                      >
                        Save
                      </button>
                      <button
                        onClick={handleCancel}
                        className={styles.cancelBtn}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleEdit(u)}
                        className={styles.editBtn}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(u._id)}
                        className={styles.deleteBtn}
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* delete confirm */}
        {confirmDelete.show && (
          <div className={styles.overlay}>
            <div className={styles.confirmDialog}>
              <p>Are you sure you want to delete this user?</p>
              <div className={styles.confirmActions}>
                <button
                  onClick={confirmDeleteUser}
                  className={styles.confirmBtn}
                >
                  Yes, Delete
                </button>
                <button
                  onClick={cancelDelete}
                  className={styles.cancelBtn}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
