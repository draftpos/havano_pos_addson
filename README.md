````markdown
### Havano POS Addson

An add-on module for the Havano POS system.  

---

### 🚀 Installation

You can install this app using the [Bench](https://github.com/frappe/bench) CLI:

```bash
cd $PATH_TO_YOUR_BENCH
bench get-app $URL_OF_THIS_REPO --branch develop
bench install-app havano_pos_addson
````

---

### 💻 Usage

**Main Links:**

* **Touch Interface:** [http://localhost:8000/havano-pos-touch-ui](http://localhost:8000/havano-pos-touch-ui)
* **Non-Touch Interface:** [http://localhost:8000/havano-pos](http://localhost:8000/havano-pos)

**Steps:**

1. First configure the POS settings in the doctype **`HA POS Setting`**.
2. Ensure **only one record** has the checkbox **HA POS Settings On** enabled.

   * If multiple are enabled, the system may not pick the correct one *(future improvement pending)*.
3. When opening a shift:

   * The system will reload automatically to load initial values.
   * Reload manually a second time to ensure all variables are properly initialized.
4. When closing a shift:

   * Reload the browser again to confirm updated values are reflected.

---

### 📑 Doctypes Used

* **HA POS Payment Method**
* **HA POS Setting**
* **Havano POS Shift**
* **Havano POS Entry**
* **Havano POS Shift Payment**
* **Havano POS Shifts**
* **Ha Pos Payment Summary**
* **Ha Pos Invoice**
* **Ha Pos Invoice Item**

---

### 📝 On Saving

* When you save, records will be created in:

  * **Havano POS Entry**
  * **Sales Invoice**
* You can use these doctypes to verify that the system is working as expected.

```