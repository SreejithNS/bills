import 'package:bills/FutureAnalysis.dart';
import 'package:bills/HomePage.dart';
import 'package:flutter/material.dart';

class TransactionAnalysis extends StatefulWidget {
  @override
  _TransactionAnalysisState createState() => _TransactionAnalysisState();
}

class _TransactionAnalysisState extends State<TransactionAnalysis> {
  bool msi = false;
  bool ifsr = false;
  bool rpa = false;

  @override
  Widget build(BuildContext context) {
    return SafeArea(
        child: Scaffold(
            appBar: AppBar(
              title: Text("TransactionAnalysis"),
            ),
            body: Container(
              padding: EdgeInsets.all(12.0),
              child: Center(
                child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      new GestureDetector(
                        onTap: () {
                          setState(() {
                            msi = true;
                          });
                        },
                        child: Card(
                          child: Padding(
                            padding: EdgeInsets.only(top: 5.0, bottom: 5.0),
                            child: new ListTile(
                              title: new Text(
                                "Most Sold Item",
                                style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                ),
                                textAlign: TextAlign.center,
                              ),
                            ),
                          ),
                        ),
                      ),
                      SizedBox(height: 10.0),
                      if (msi == true) Center(child: Text(" Maggi ")),
                      SizedBox(height: 10.0),
                      new GestureDetector(
                        onTap: () {
                          setState(() {
                            ifsr = true;
                          });
                        },
                        child: Card(
                          child: Padding(
                            padding: EdgeInsets.only(top: 5.0, bottom: 5.0),
                            child: new ListTile(
                              title: new Text(
                                "Item which has faster selling rate",
                                style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                ),
                                textAlign: TextAlign.center,
                              ),
                            ),
                          ),
                        ),
                      ),
                      SizedBox(height: 10.0),
                      if (ifsr == true) Center(child: Text(" Colgate ")),
                      SizedBox(height: 10.0),
                      new GestureDetector(
                        onTap: () {
                          setState(() {
                            rpa = true;
                          });
                        },
                        child: Card(
                          child: Padding(
                            padding: EdgeInsets.only(top: 5.0, bottom: 5.0),
                            child: new ListTile(
                              title: new Text(
                                "Redundant Product",
                                style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                ),
                                textAlign: TextAlign.center,
                              ),
                            ),
                          ),
                        ),
                      ),
                      SizedBox(height: 10.0),
                      if (rpa == true)
                        Center(
                          child: Text(
                            "The sales for oreo 15g is less "
                            " To increase your sales, you can sell that "
                            "for 15% discount.",
                            textAlign: TextAlign.center,
                          ),
                        ),
                      SizedBox(height: 10.0),
                      new GestureDetector(
                        onTap: () {
                          Navigator.push(
                              context,
                              MaterialPageRoute(
                                  builder: (context) => FutureAnalysis()));
                        },
                        child: Card(
                          child: Padding(
                            padding: EdgeInsets.only(top: 5.0, bottom: 5.0),
                            child: new ListTile(
                              title: new Text(
                                "Future analysis",
                                style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                ),
                                textAlign: TextAlign.center,
                              ),
                            ),
                          ),
                        ),
                      ),
                    ]),
              ),
            )));
  }
}
