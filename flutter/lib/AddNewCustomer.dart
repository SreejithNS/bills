import 'dart:convert';
import "package:flutter/material.dart";
import 'package:flutter/services.dart';
import 'HomePage.dart';
import 'NetworkHandler.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class AddNewCustomer extends StatefulWidget {
  @override
  _AddNewCustomerState createState() => _AddNewCustomerState();
}

class _AddNewCustomerState extends State<AddNewCustomer> {
  final _globalkey = GlobalKey<FormState>();
  NetworkHandler networkHandler = NetworkHandler();
  TextEditingController _phoneController = TextEditingController();
  TextEditingController _nameController = TextEditingController();
  final storage = new FlutterSecureStorage();
  bool circular = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
        appBar: AppBar(
          title: Text("New Customer"),
        ),
        body: Container(
          child: Form(
            key: _globalkey,
            child: Padding(
              padding:
                  const EdgeInsets.symmetric(horizontal: 40, vertical: 10.0),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    "Enter The Details",
                    style: TextStyle(
                      fontSize: 30,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 2,
                    ),
                  ),
                  SizedBox(
                    height: 20,
                  ),
                  nameTextField(),
                  SizedBox(
                    height: 15,
                  ),
                  phoneTextField(),
                  SizedBox(
                    height: 30,
                  ),
                  InkWell(
                    onTap: () async {
                      setState(() {
                        circular = true;
                      });
                      if (_globalkey.currentState.validate()) {
                        //Login Logic start here
                        Map<String, String> data = {
                          "name": _nameController.text,
                          "phone": _phoneController.text,
                        };
                        print(data);
                        var response =
                            await networkHandler.post("/customer", data);
                        print(response.statusCode);
                        Map<String, dynamic> output =
                            json.decode(response.body);
                        print(output["message"]);
                        print(output["data"]);
                        print(response.statusCode);
                        if (response.statusCode == 200 ||
                            response.statusCode == 201) {
                          circular = false;
                          showDialog(
                            context: context,
                            builder: (_) => AlertDialog(
                                title: Text('Customer Added successfully'),
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
                        });
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
                              child: circular
                                  ? CircularProgressIndicator()
                                  : Text(
                                      "Add",
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
              ),
            ),
          ),
        ));
  }

  Widget phoneTextField() {
    return Column(
      children: [
        Text("Phone Number"),
        TextFormField(
          validator: (value) {
            if (value.isEmpty) return "Phone number can't be empty";
            if (value.length != 10) return "Phone number is invalid";
            return null;
          },
          inputFormatters: [WhitelistingTextInputFormatter.digitsOnly],
          controller: _phoneController,
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
    );
  }

  Widget nameTextField() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 10.0),
      child: Column(
        children: [
          Text("Name"),
          TextFormField(
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
}
