### Havano Pos Addson

addson of the havano pos

### Installation

You can install this app using the [bench](https://github.com/frappe/bench) CLI:

```bash
cd $PATH_TO_YOUR_BENCH
bench get-app $URL_OF_THIS_REPO --branch develop
bench install-app havano_pos_addson
```

### Usage

# main link
# For Touch
http://localhost:8000/havano-pos-touch-ui

# For non touch 
http://localhost:8000/havano-pos

# Usage

-First set the settings of the POS settings on the doctype `HA POS Setting`
- Make sure only one record, on that doctype is ticked HA POS Settings On, if you tick multiple then the system might not pick the correct one [Future issue to be fixed]
-When you open a shift the system will automatically reload to allow initial values to be loaded in the browser, reload manually for the second time, to make sure all variables are loaded.

- when you close the shift, also reload the browser as well.

# Doctypes used

HA POS Payment Method
HA POS Setting
Havano POS Shift
Havano POS Entry
Havano POS Shift Payment
Havano POS Shifts
Ha Pos Payment Summary
Ha Pos Invoice
Ha Pos Invoice Item

# On saving.
-When you save , you can check this doctype Havano POS Entry and the sales invoice doctypes, to see if records have beend created, this is just for checking to see if everything is working well.