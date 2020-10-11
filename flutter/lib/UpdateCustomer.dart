import 'package:bills/Customers.dart';
import 'package:bills/Inventory.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'dart:convert';
import 'HomePage.dart';
import 'NetworkHandler.dart';

class UpdateCustomer extends StatefulWidget {
  final String id;
  final String name;
  final String phone;
  UpdateCustomer(this.id, this.name, this.phone);
  @override
  _UpdateCustomerState createState() => _UpdateCustomerState(id, name, phone);
}

class _UpdateCustomerState extends State<UpdateCustomer> {
  final String id;
  final String name;
  final String phone;
  _UpdateCustomerState(this.id, this.name, this.phone);
  final _globalkey = GlobalKey<FormState>();
  NetworkHandler networkHandler = NetworkHandler();
  final storage = new FlutterSecureStorage();
  bool circular = false;
  bool circular1 = false;
  TextEditingController _nameController;
  TextEditingController _placeController;
  TextEditingController _phoneController;

  @override
  void initState() {
    super.initState();
    _nameController = new TextEditingController(text: name);
    _placeController = new TextEditingController();
    _phoneController = new TextEditingController(text: phone);
    print(name);
    print(phone);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
        appBar: AppBar(
          title: Text("Update Customer"),
        ),
        body: Form(
            key: _globalkey,
            child: Container(
                child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                nameTextField(),
                placeTextField(),
                phoneTextField(),
                SizedBox(
                  height: 10,
                ),
                InkWell(
                  onTap: () async {
                    setState(() {
                      circular = true;
                    });
                    if (_globalkey.currentState.validate()) {
                      Map<String, String> data = {
                        "firstName": _nameController.text,
                        if (_placeController.text != "")
                          "place": _placeController.text,
                        "phone": _phoneController.text,
                      };
                      print(_nameController.text);
                      var response =
                          await networkHandler.put("/customer/$id", data);

                      print(response.statusCode);

                      Map<String, dynamic> output = json.decode(response.body);
                      print(output["message"]);
                      print(output["data"]);
                      setState(() {
                        circular = false;
                      });
                      if (response.statusCode == 200 ||
                          response.statusCode == 201) {
                        circular = false;
                        showDialog(
                          context: context,
                          builder: (_) => AlertDialog(
                              title: Text('Customer Updated successfully'),
                              actions: <Widget>[
                                RaisedButton(
                                  onPressed: () {
                                    Navigator.pushAndRemoveUntil(
                                        context,
                                        MaterialPageRoute(
                                          builder: (context) => HomePage(),
                                        ),
                                        (route) => false);
                                  },
                                  child: Text("ok"),
                                )
                              ]),
                          barrierDismissible: true,
                        );
                      } else {
                        setState(() {
                          circular = false;
                        });
                      }
                    } else {
                      setState(() {
                        circular = false;
                        showDialog(
                          context: context,
                          builder: (_) => AlertDialog(
                              title: Text('Error'),
                              actions: <Widget>[
                                RaisedButton(
                                  onPressed: () {
                                    Navigator.of(context).pop();
                                  },
                                  child: Text("ok"),
                                )
                              ]),
                          barrierDismissible: false,
                        );
                      });
                    }
                  },
                  child: circular
                      ? CircularProgressIndicator()
                      : Container(
                          width: 150,
                          height: 50,
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(10),
                            color: Color(0xff00A86B),
                          ),
                          child: Center(
                            child: Text(
                              "Update",
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ),
                ),
                SizedBox(
                  height: 10,
                ),
                InkWell(
                  onTap: () async {
                    setState(() {
                      circular1 = true;
                    });

                    var response = await networkHandler.delete("/customer/$id");

                    print(response.statusCode);

                    Map<String, dynamic> output = json.decode(response.body);
                    print(output["message"]);
                    print(output["data"]);
                    setState(() {
                      circular1 = false;
                    });
                    if (response.statusCode == 200 ||
                        response.statusCode == 201) {
                      circular1 = false;
                      showDialog(
                        context: context,
                        builder: (_) => AlertDialog(
                            title: Text('Customer Deleted successfully'),
                            actions: <Widget>[
                              RaisedButton(
                                onPressed: () {
                                  Navigator.pushAndRemoveUntil(
                                      context,
                                      MaterialPageRoute(
                                        builder: (context) => HomePage(),
                                      ),
                                      (route) => false);
                                },
                                child: Text("ok"),
                              )
                            ]),
                        barrierDismissible: true,
                      );
                    } else {
                      setState(() {
                        circular1 = false;
                        showDialog(
                          context: context,
                          builder: (_) => AlertDialog(
                              title: Text('Error'),
                              actions: <Widget>[
                                RaisedButton(
                                  onPressed: () {
                                    Navigator.of(context).pop();
                                  },
                                  child: Text("ok"),
                                )
                              ]),
                          barrierDismissible: false,
                        );
                      });
                    }
                  },
                  child: circular1
                      ? CircularProgressIndicator()
                      : Container(
                          width: 150,
                          height: 50,
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(10),
                            color: Color(0xff00A86B),
                          ),
                          child: Center(
                            child: Text(
                              "Delete",
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ),
                ),
              ],
            ))));
  }

  Widget nameTextField() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 10.0),
      child: Column(
        children: [
          Text("Name"),
          TextFormField(
            onChanged: (text) {
              _nameController.text = text;
            },
            validator: (value) {
              if (value.isEmpty) return "Name can't be empty";
              return null;
            },
            controller: _nameController,
            decoration: InputDecoration(
              focusedBorder: UnderlineInputBorder(
                borderSide: BorderSide(
                  color: Colors.black,
                  width: 2,
                ),
              ),
            ),
          )
        ],
      ),
    );
  }

  Widget placeTextField() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 10.0),
      child: Column(
        children: [
          Text("Place"),
          TextFormField(
            onChanged: (text) {
              _placeController.text = text;
            },
            controller: _placeController,
            decoration: InputDecoration(
              focusedBorder: UnderlineInputBorder(
                borderSide: BorderSide(
                  color: Colors.black,
                  width: 2,
                ),
              ),
            ),
          )
        ],
      ),
    );
  }

  Widget phoneTextField() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 10.0),
      child: Column(
        children: [
          Text("Phone Number"),
          TextFormField(
            onChanged: (text) {
              _phoneController.text = text;
            },
            inputFormatters: [WhitelistingTextInputFormatter.digitsOnly],
            controller: _phoneController,
            validator: (value) {
              if (value.isEmpty) return "Phone number can't be empty";
              if (value.length != 10) return "Phone number is invalid";
              return null;
            },
            decoration: InputDecoration(
              focusedBorder: UnderlineInputBorder(
                borderSide: BorderSide(
                  color: Colors.black,
                  width: 2,
                ),
              ),
            ),
          )
        ],
      ),
    );
  }
}
