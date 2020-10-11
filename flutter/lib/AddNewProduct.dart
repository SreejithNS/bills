import 'dart:convert';
import 'package:bills/Inventory.dart';
import "package:flutter/material.dart";
import 'package:flutter/services.dart';
import 'HomePage.dart';
import 'NetworkHandler.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class AddNewProduct extends StatefulWidget {
  @override
  _AddNewProductState createState() => _AddNewProductState();
}

class _AddNewProductState extends State<AddNewProduct> {
  final _globalkey = GlobalKey<FormState>();
  NetworkHandler networkHandler = NetworkHandler();
  TextEditingController _codeController = TextEditingController();
  TextEditingController _nameController = TextEditingController();
  TextEditingController _mrpController = TextEditingController();
  TextEditingController _rateController = TextEditingController();
  TextEditingController _weightController = TextEditingController();
  TextEditingController _weightUnitController = TextEditingController();
  final storage = new FlutterSecureStorage();
  bool circular = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
        appBar: AppBar(
          title: Text("New Product"),
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
                  codeTextField(),
                  SizedBox(
                    height: 15,
                  ),
                  mrpTextField(),
                  SizedBox(
                    height: 15,
                  ),
                  rateTextField(),
                  SizedBox(
                    height: 15,
                  ),
                  weightTextField(),
                  SizedBox(
                    height: 15,
                  ),
                  weightUniteTextField(),
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
                          "code": _codeController.text,
                          "name": _nameController.text,
                          "mrp": _mrpController.text,
                          "rate": _rateController.text,
                          if (_weightController.text != "")
                            "weight": _weightController.text,
                          if (_weightUnitController.text != "")
                            "weightUnit": _weightUnitController.text,
                        };
                        print(data);
                        var response =
                            await networkHandler.post("/product", data);
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
                                title: Text('Product Added successfully'),
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

  Widget codeTextField() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 10.0),
      child: Column(
        children: [
          TextFormField(
            validator: (value) {
              if (value.isEmpty) return "Code can't be empty";
              return null;
            },
            controller: _codeController,
            decoration: InputDecoration(
              hintText: 'Item Code',
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

  Widget nameTextField() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 10.0),
      child: Column(
        children: [
          TextFormField(
            validator: (value) {
              if (value.isEmpty) return "Product Name can't be empty";
              return null;
            },
            controller: _nameController,
            decoration: InputDecoration(
              hintText: 'Product name',
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

  Widget mrpTextField() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 10.0),
      child: Column(
        children: [
          TextFormField(
            validator: (value) {
              if (value.isEmpty) return "MRP can't be empty";
              return null;
            },
            controller: _mrpController,
            decoration: InputDecoration(
              hintText: 'MRP',
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

  Widget rateTextField() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 10.0),
      child: Column(
        children: [
          TextFormField(
            validator: (value) {
              if (value.isEmpty) return "Rate can't be empty";
              return null;
            },
            controller: _rateController,
            decoration: InputDecoration(
              hintText: 'Rate',
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

  Widget weightTextField() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 10.0),
      child: Column(
        children: [
          TextFormField(
            controller: _weightController,
            decoration: InputDecoration(
              hintText: 'Weight',
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

  Widget weightUniteTextField() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 10.0),
      child: Column(
        children: [
          TextFormField(
            controller: _weightUnitController,
            decoration: InputDecoration(
              hintText: 'Weight Unit',
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
