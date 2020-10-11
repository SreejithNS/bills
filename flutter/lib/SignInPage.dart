import 'dart:convert';
import "package:flutter/material.dart";
import 'package:flutter/services.dart';
import 'HomePage.dart';
import 'NetworkHandler.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import 'SignUpPage.dart';

class SignInPage extends StatefulWidget {
  SignInPage({Key key}) : super(key: key);

  @override
  _SignInPageState createState() => _SignInPageState();
}

class _SignInPageState extends State<SignInPage> {
  bool vis = true;
  final _globalkey = GlobalKey<FormState>();
  NetworkHandler networkHandler = NetworkHandler();
  TextEditingController _phoneController = TextEditingController();
  TextEditingController _passwordController = TextEditingController();
  String errorText;
  bool validate = false;
  bool circular = false;
  final storage = new FlutterSecureStorage();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        child: Form(
          key: _globalkey,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 10.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  "Sign In",
                  style: TextStyle(
                    fontSize: 30,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 2,
                  ),
                ),
                SizedBox(
                  height: 20,
                ),
                phoneTextField(),
                SizedBox(
                  height: 15,
                ),
                passwordTextField(),
                SizedBox(
                  height: 20,
                ),
                InkWell(
                  onTap: () {
                    Navigator.pushReplacement(context,
                        MaterialPageRoute(builder: (context) => SignUpPage()));
                  },
                  child: Text(
                    "New User?",
                    style: TextStyle(
                      color: Colors.blue[900],
                      fontSize: 15,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
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
                        "phone": _phoneController.text,
                        "password": _passwordController.text,
                      };
                      print(data);
                      var response =
                          await networkHandler.post("/auth/login", data);
                      print(response.statusCode);
                      Map<String, dynamic> output = json.decode(response.body);
                      print(output["message"]);
                      print(output["data"]);
                      if (response.statusCode == 200 ||
                          response.statusCode == 201) {
                        await storage.write(
                            key: "token", value: output["data"]["token"]);
                        String value = await storage.read(key: "token");
                        print(value);
                        setState(() {
                          validate = true;
                          circular = false;
                        });
                        Navigator.pushAndRemoveUntil(
                            context,
                            MaterialPageRoute(
                              builder: (context) => HomePage(),
                            ),
                            (route) => false);
                      } else {
                        setState(() {
                          circular = false;
                        });
                      }
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
                                    "Sign In",
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
      ),
    );
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
            errorText: validate ? null : errorText,
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

  Widget passwordTextField() {
    return Column(
      children: [
        Text("Password"),
        TextFormField(
          validator: (value) {
            if (value.isEmpty) return "Password can't be empty";
            if (value.length < 8) return "Password lenght must have >=8";
            return null;
          },
          controller: _passwordController,
          obscureText: vis,
          decoration: InputDecoration(
            errorText: validate ? null : errorText,
            suffixIcon: IconButton(
              icon: Icon(vis ? Icons.visibility_off : Icons.visibility),
              onPressed: () {
                setState(() {
                  vis = !vis;
                });
              },
            ),
            helperStyle: TextStyle(
              fontSize: 14,
            ),
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
}
